// // components/ChatActionButtons.js
// import React from 'react';
// import Image from 'next/image';
// import copy from '@/public/ai/copy.svg';
// import refresh from '@/public/ai/refresh.svg';
// import filter from '@/public/ai/filter.svg';

// import download from '@/public/ai/download.svg';

// export default function ChatActionButtons({
//   isCopied,
//   setIsCopied,
//   handleCopyChat,
//   copyHover,
//   setCopyHover,
//   handleRefreshContent,
//   formattedContent,
//   formattedTitle,
//   handleFilterButtonClick,
//   handleDownloadChat,
//   setIsDashboardActive
// }) {
//   return (

//     <>
//     <div className="chat-action-buttons">
//       <div className='chat-action-buttons-left'>
//           <div className="filter-chat-button" onClick={handleFilterButtonClick}>
//             <Image src={filter} height={19} alt='filter'/>
//           </div>
//           {/* <div>1/3 left</div> */}
//       </div>
//       <div className='chat-action-buttons-right'>
//           <div className="copy-chat-button" onClick={() => {setIsCopied(!isCopied); handleCopyChat()}} onMouseEnter={() => setCopyHover(true)} onMouseLeave={() => setCopyHover(false)}>
//             <Image src={copy}  height={14}  alt='copy'/>
//             <div className="chat-button-label">
//               {isCopied && (
//                 <div className="chat-button-label-copied">Copied</div>
//               )}
//             </div>
//           </div>
//           <div className="download-chat-button">
//             <Image src={download} height={14}    onClick={() => formattedTitle && handleDownloadChat()} alt='download'/>
//           </div>
//           <div className="refresh-chat-button" onClick={handleRefreshContent}>
//             <Image src={refresh} height={13} alt='refresh'/>
//           </div>
//       </div>
//     </div>
//     {formattedContent && <div className="chat-action-buttons-mobile">
//       <div className='chat-action-buttons-left'>
//       {/* <div className="filter-chat-button" onClick={handleFilterButtonClick}>
//             <Image src={filter} height={19} alt='download'/>
//           </div> */}
//       </div>
//       <div className='chat-action-buttons-right'>
//       <div className="copy-chat-button" onClick={() => {setIsCopied(!isCopied); handleCopyChat()}} onMouseEnter={() => setCopyHover(true)} onMouseLeave={() => setCopyHover(false)}>
//       <Image src={copy}  height={14}  alt='copy'/>
//             <div className="chat-button-label">
//               {isCopied && (
//                 <div className="chat-button-label-copied">Copied</div>
//               )}
//             </div>
//           </div>
//           <div className="download-chat-button">
//             <Image src={download} height={14}    onClick={() => formattedTitle && handleDownloadChat()} alt='download'/>
//           </div>
//           <div className="refresh-chat-button" onClick={handleRefreshContent}>
//             <Image src={refresh} height={13} alt='refresh'/>
//           </div>
//       </div>
//     </div>}
//     </>
//   );
// }

// components/ChatActionButtons.js
import React from "react";
import Image from "next/image";
import copy from "@/public/ai/copy.svg";
import refresh from "@/public/ai/refresh.svg";
import filter from "@/public/ai/filter.svg";
import styles from "@/styles/ai/ContentAi.module.css";

import download from "@/public/ai/download.svg";

export default function ChatActionButtons({
  isCopied,
  setIsCopied,
  handleCopyChat,
  copyHover,
  setCopyHover,
  handleRefreshContent,
  formattedContent,
  formattedTitle,
  handleFilterButtonClick,
  handleDownloadChat,
  setIsDashboardActive,
}) {
  return (
    <>
      <div className={styles.chatActionButtons}>
        <div className={styles.chatActionButtonsLeft}>
          <div
            className={styles.filterChatButton}
            onClick={handleFilterButtonClick}
          >
            <Image src={filter} height={19} alt="filter" />
          </div>
        </div>
        <div className={styles.chatActionButtonsRight}>
          <div
            className={styles.copyChatButton}
            onClick={() => {
              setIsCopied(!isCopied);
              handleCopyChat();
            }}
            onMouseEnter={() => setCopyHover(true)}
            onMouseLeave={() => setCopyHover(false)}
          >
            <Image src={copy} height={14} alt="copy" />
            <div className={styles.chatButtonLabel}>
              {isCopied && (
                <div className={styles.chatButtonLabelCopied}>Copied</div>
              )}
            </div>
          </div>
          <div className={styles.downloadChatButton}>
            <Image
              src={download}
              height={14}
              onClick={() => formattedTitle && handleDownloadChat()}
              alt="download"
            />
          </div>
          <div
            className={styles.refreshChatButton}
            onClick={handleRefreshContent}
          >
            <Image src={refresh} height={13} alt="refresh" />
          </div>
        </div>
      </div>
      {formattedContent && (
        <div className={styles.chatActionButtonsMobile}>
          <div className={styles.chatActionButtonsLeft}></div>
          <div className={styles.chatActionButtonsRight}>
            <div
              className={styles.copyChatButton}
              onClick={() => {
                setIsCopied(!isCopied);
                handleCopyChat();
              }}
              onMouseEnter={() => setCopyHover(true)}
              onMouseLeave={() => setCopyHover(false)}
            >
              <Image src={copy} height={14} alt="copy" />
              <div className={styles.chatButtonLabel}>
                {isCopied && (
                  <div className={styles.chatButtonLabelCopied}>Copied</div>
                )}
              </div>
            </div>
            <div className={styles.downloadChatButton}>
              <Image
                src={download}
                height={14}
                onClick={() => formattedTitle && handleDownloadChat()}
                alt="download"
              />
            </div>
            <div
              className={styles.refreshChatButton}
              onClick={handleRefreshContent}
            >
              <Image src={refresh} height={13} alt="refresh" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
