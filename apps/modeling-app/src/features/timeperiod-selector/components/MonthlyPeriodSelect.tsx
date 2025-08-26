import i18n from "@dhis2/d2-i18n";

import styles from "./styles/Period.module.css";
import React from "react";
import TimePeriodInputField from "./TimePeriodInputField";


const MonthlyPeriodSelect = ({ period, onChange } : any) => {


  return (
    <div className={styles.container}>
      <h2>{i18n.t("Period")}</h2>
      <div className={styles.pickers}>
        <TimePeriodInputField
          label={i18n.t("Start month")}
          onChange={(startMonth: any) => onChange({ ...period, startMonth })} periodeType={"week"} name={""}        />
        <TimePeriodInputField
          label={i18n.t("End month")}
          onChange={(endMonth: any) => onChange({ ...period, endMonth })} periodeType={"week"} name={""}        />
      </div>
    </div>
  );
};


export default MonthlyPeriodSelect;
