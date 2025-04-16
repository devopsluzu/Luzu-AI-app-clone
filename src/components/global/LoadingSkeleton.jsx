import React from "react";
import styles from "@/styles/ai/ContentAi.module.css";

const LoadingSkeleton = () => {
  return (
    <div className={`${styles.loadingSkeleton} loading-skeleton ai-message`}>
      <div className={styles.skeletonLine}></div>
      <div className={styles.skeletonLine}></div>
      <div className={styles.skeletonLine}></div>
    </div>
  );
};

export default LoadingSkeleton;
