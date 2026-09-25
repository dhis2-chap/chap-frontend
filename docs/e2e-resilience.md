# Manual E2E resilience runs

The `e2e-resilience` GitHub Actions workflow runs the normal Playwright suite
under explicitly degraded conditions. It has only a `workflow_dispatch`
trigger, so it never runs automatically for a pull request or push.

The workflow starts the same live CHAP and DHIS2 stack as the normal e2e jobs
and invokes the existing `*.spec.ts` discovery through `playwright test`. New
tests added to the normal suite are therefore included without maintaining a
second test list.

## Profiles

| Profile | Impairment | What it represents |
| --- | --- | --- |
| `poor-network` | Linux `netem` on loopback: 150 ms delay with 30 ms jitter and 25% correlation, 0.5% packet loss with 25% correlation, and 1.6 Mbit/s rate | A reproducible poor local link for browser, authentication, app, DHIS2, and CHAP traffic |
| `constrained-compute` | The Playwright command and its browser/web-server descendants are pinned to one allowed logical CPU | Real Linux scheduler affinity and contention between the test runner, browser, and frontend server |
| `combined` | Both impairments | The default and most demanding profile |

Linux [`netem`](https://man7.org/linux/man-pages/man8/netem.8.html) provides
kernel-level delay, loss, and rate emulation. The rate and timer behavior are
still subject to kernel granularity, and packet loss remains stochastic. The
profile affects loopback traffic because every tested service is exposed on
localhost; it does not reproduce cellular radio behavior, DNS failures, or
internet routing.

[`taskset`](https://man7.org/linux/man-pages/man1/taskset.1.html) sets CPU
affinity. Linux documents that
[child processes inherit affinity across fork and exec](https://man7.org/linux/man-pages/man2/sched_setaffinity.2.html).
It limits the Playwright process tree to one logical CPU, but it does not lower
that CPU's clock speed and it does not constrain the Dockerized CHAP/DHIS2
backend.

This is not hardware simulation. The workflow records runner CPU and memory,
but it does not impose a memory limit. Browser memory limits based on virtual
address space are not representative, while job-wide cgroup limits are not a
portable GitHub-hosted runner contract. Use a deliberately sized self-hosted
runner when validating a real low-memory target. GitHub documents the current
[hosted runner resources](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).

Playwright device emulation changes browser-visible properties such as
viewport, user agent, and touch support; it does not emulate slower hardware.
It is intentionally excluded from this desktop resilience job. See
[Playwright emulation](https://playwright.dev/docs/emulation).

## Trigger a run

In GitHub, open **Actions**, select **e2e-resilience**, choose **Run workflow**,
select the branch, and set:

- `profile`: degraded condition to apply.
- `retries`: `0` exposes every first-attempt failure; `1` or `2` preserves
  evidence of transient failures while allowing recovery.
- `workers`: Playwright process concurrency. One worker is the most
  reproducible choice.
- `timeout_ms`: default per-test timeout. Tests that set their own timeout
  retain that explicit value.

The equivalent GitHub CLI command is:

```bash
gh workflow run e2e-resilience.yml \
  --ref <branch> \
  -f profile=combined \
  -f retries=1 \
  -f workers=1 \
  -f timeout_ms=300000
```

GitHub requires a manually dispatched workflow file to exist on the default
branch before it appears in the Actions UI. Once merged, any branch can be
selected for a run. See GitHub's
[manual workflow instructions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

## Interpret failures

The workflow uploads a 14-day artifact containing the HTML report, retained
videos and failure traces, the active traffic-control rule, runner CPU/memory
details, container status, and Docker logs.

- A test that fails first and passes on retry is still resilience evidence.
  Inspect the failed attempt's trace rather than treating the run as clean.
- Repeated assertion failures usually indicate application behavior that does
  not tolerate the selected profile.
- Setup or authentication failures indicate that the whole request path could
  not tolerate the profile, before a user journey began.
- A timeout means the journey exceeded the configured or test-specific budget;
  compare its trace with a normal e2e run before increasing the budget.
- Infrastructure failures before the test command should be diagnosed from
  `runtime.txt`, `network.txt`, container status, and Docker logs.

Retries restart the failed Playwright worker and browser. Worker count,
timeouts, retries, and tracing are test-runner controls rather than hardware
impairments; see the Playwright documentation for
[retries](https://playwright.dev/docs/test-retries) and
[CLI options](https://playwright.dev/docs/test-cli).

## Local validation

On Linux, start the stack and run the same script:

```bash
pnpm docker:e2e up --wait
E2E_RESILIENCE_PROFILE=combined ./scripts/ci/run-e2e-resilience.sh
pnpm docker:e2e down
```

The network profiles require passwordless `sudo` for `tc` and refuse to
replace a non-default loopback queue discipline. The script always removes the
rule it installed when it exits.

On macOS or without changing traffic control, validate profile selection and
the generated Playwright command with:

```bash
E2E_RESILIENCE_DRY_RUN=1 \
  E2E_RESILIENCE_PROFILE=combined \
  ./scripts/ci/run-e2e-resilience.sh
```
