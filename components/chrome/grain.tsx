import styles from "./grain.module.css"

/**
 * Global film grain (§4.3). One fixed, aria-hidden, non-interactive layer at z-45: above content,
 * below the header and the cold open. Pure CSS (compositor transform steps); static under still.
 */
export function Grain() {
  return <div aria-hidden="true" className={styles.grain} />
}
