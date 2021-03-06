import React, { useEffect, useState } from 'react';
import styles from './Settings.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { selectSettings } from '../../redux/store';
import { setSettings } from '../../redux/slices/settingsSlice';
import type { WriteableSettings } from '@tiktofiy/common';
import { useDebounce } from '../../hooks/useDebounce';

export const Settings = () => {
  const userSettings = useSelector(selectSettings);
  const [settingsValue, setSettingsValue] = useState<WriteableSettings>(userSettings);
  const debouncedSettings = useDebounce<WriteableSettings>(settingsValue);
  const dispatch = useDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettingsValue({
      ...userSettings,
      [e.currentTarget.name]: e.currentTarget.value,
    });
  };

  useEffect(() => {
    dispatch(setSettings(debouncedSettings));
  }, [debouncedSettings]);

  return (
    <main className={styles.settings}>
      <div className={styles.group}>
        <div className={styles.label}>shazam api key</div>
        <div className={styles.option}>
          <input
            type="password"
            className={styles.keyInput}
            name="shazamApiKey"
            placeholder="paste your key..."
            onChange={handleChange}
            defaultValue={userSettings.shazamApiKey}
          />
        </div>
      </div>
      <div className={styles.group}>
        <div className={styles.label}>audio range</div>
        <div className={styles.option}>
          <input
            type="number"
            className={styles.rangeInput}
            name="start"
            placeholder="start"
            onChange={handleChange}
            defaultValue={userSettings.start}
          />
          <input
            type="number"
            className={styles.rangeInput}
            name="end"
            placeholder="end"
            onChange={handleChange}
            defaultValue={userSettings.end}
          />
        </div>
      </div>
    </main>
  );
};
