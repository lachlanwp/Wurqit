import appIcon from "@/assets/icon.png";
import styles from "./AppHeader.module.css";

export function AppHeader() {
  return (
    <header className={styles.header}>
      <img src={appIcon} alt="WURQIT App Icon" className={styles.icon} />
      <h1 className={styles.title}>WURQIT</h1>
    </header>
  );
}
