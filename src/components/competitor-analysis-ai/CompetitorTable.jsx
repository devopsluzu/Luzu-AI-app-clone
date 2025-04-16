import styles from "@/styles/ai/CompetitorAi.module.css";

export default function CompetitorTable({ users, heading }) {
  return (
    <div className={styles.competitorTopTable}>
      <div className={styles.competitorTopTableScroll}>
        <table className={styles.competitorTopTableContainer}>
          <thead className={styles.competitorTopHead}>
            <tr className={styles.competitorTopRow}>
              {heading.map((item, index) => (
                <th className={styles.competitorTopRowContents} key={index}>
                  {item.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.competitorTopBody}>
            {users.map((user, rowIndex) => (
              <tr className={styles.competitorTopBodyRow} key={rowIndex}>
                {heading.map((col, colIndex) => (
                  <td
                    className={styles.competitorTopBodyRowContents}
                    key={colIndex}
                  >
                    {user[col.id]}{" "}
                    {/* Access data dynamically based on heading */}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
