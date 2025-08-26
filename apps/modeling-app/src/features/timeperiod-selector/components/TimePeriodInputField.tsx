import React, { useRef } from "react";
import styles from "./MonthPicker.module.css";


interface TimePeriodInputFieldProps {
  periodeType : "week" | "month" | ""
  label: string
  name: string
  onChange: (value: string) => void
}

// Fallback on browser native until full DatePicker support in @dhis2/ui
const TimePeriodInputField = ({ label, name, onChange, periodeType } : TimePeriodInputFieldProps) => {
  const inputEl = useRef(null);

  return (
    <div className={styles.datePicker} style={{opacity: periodeType === "" ? 0.6 : 1}}>
      <label className={styles.label}>{label}</label>
      <div className={styles.content}>
        <div className={styles.box}>
          <div className={styles.inputDiv}>
            <input
              disabled={periodeType === ""}
              
              className={styles.input}
              ref={inputEl}
              type={periodeType}
              name={name}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimePeriodInputField;
