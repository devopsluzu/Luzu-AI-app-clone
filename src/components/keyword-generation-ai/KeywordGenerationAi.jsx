// "use client";

// import { useState, useEffect, useRef } from "react";
// import styles from "@/styles/ai/KeywordAi.module.css";
// import Image from "next/image";
// import { database } from "@/firebase";
// import { getDatabase, ref, set, get, push } from "firebase/database";
// import { useKeyPrompt } from "@/context/keyword-prompt-context";
// import useCountryList from "react-select-country-list"; // Import the country list hook
// import arrow from "@/public/ai/drop.svg";
// import AiDashboard from "@/components/global/Dashboard";
// import LinearProgress from "@mui/material/LinearProgress";
// import { v4 as uuidv4 } from "uuid";
// import { useRouter } from "next/navigation";
// import CircularProgress from "@mui/material/CircularProgress";
// import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

// export default function KeywordGenerationAi({ contentId }) {
//   const { keywordPromptCount, setKeywordPromptCount } = useKeyPrompt(); // Use the keyword prompt context
//   const [keyword, setKeyword] = useState("");
//   const [country, setCountry] = useState("US"); // Default country set to 'US'
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);

//   const [countrySearch, setCountrySearch] = useState("");
//   const dropdownRef = useRef(null);
//   const inputRef = useRef(null); // Ref for the dropdown container
//   const router = useRouter();
//   const { user, isLoading } = useKindeBrowserClient();

//   let planType = "free";
//   let maxPrompts = 3;

//   useEffect(() => {
//     if (isLoading) return;
//     const fetchKeywordData = async () => {
//       if (!contentId) return;

//       const userId = user.id;
//       const db = getDatabase();

//       try {
//         // Fetch id and country from 'keyword-research-prompts/{userId}/{contentId}'
//         const keywordRef = ref(
//           db,
//           `keyword-research-prompts/${userId}/${contentId}`
//         );

//         const keywordSnapshot = await get(keywordRef);

//         if (!keywordSnapshot.exists()) {
//           console.error("No keyword data found.");
//           return;
//         }

//         const { id, country } = keywordSnapshot.val(); // Extract id and country
//         const keywordAnalysisRef = ref(db, `keywords/${id}/${country}`);
//         const analysisSnapshot = await get(keywordAnalysisRef);
//         if (analysisSnapshot.exists()) {
//           setResult(analysisSnapshot.val());
//           setKeyword(id);
//           setCountry(country); // <-- Ensure country is set when loading data
//         } else {
//           console.error("No analysis data found.");
//         }
//       } catch (error) {
//         console.error("Error fetching keyword data:", error);
//         setError(error.message);
//       }
//     };

//     fetchKeywordData();
//   }, [contentId, user]); // Runs when keywordId changes

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsDropdownOpen(false); // Close dropdown if clicked outside
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside); // Listen for clicks
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside); // Cleanup listener on unmount
//     };
//   }, []);

//   const countries = useCountryList(); // Use the hook to get country list
//   const countryOptions = countries.getData().map((country) => ({
//     label: country.label,
//     value: country.value,
//   }));
//   const analyzeKeyword = async () => {
//     setLoading(true);
//     setError(null);
//     setResult(null);

//     const userId = user.id;
//     console.log("id", user.id)
//     const db = getDatabase();
//     const planRef = ref(db, `subscriptions/${userId}/planType`);
//     const snapshot = await get(planRef);

//     const keywordId = uuidv4();
//     const currentDate = Date.now(); // (Stores full UTC timestamp)
//     const keywordRef = ref(db, `keyword-research-prompts/${userId}/`);
//     const checkSnapshot = await get(keywordRef);

//     if (!checkSnapshot.exists()) {
//       const checkKeywordRef = ref(
//         db,
//         `keyword-research-prompts/${userId}/${keywordId}`
//       );
//       await set(checkKeywordRef, { id: keyword, country, date: currentDate });
//     }

//     try {
//       const keywordAnalysisRef = ref(
//         database,
//         `keywords/${keyword}/${country}`
//       );
//       const snapshot = await get(keywordAnalysisRef);

//       if (snapshot.exists()) {
//         const pastKeywordsRef = ref(db, `/keyword-research-prompts/${userId}/`);
//         const pastSnapshot = await get(pastKeywordsRef);
//         if (pastSnapshot.exists()) {
//           const data = pastSnapshot.val();
//           let pastKeywordId = null;

//           // Find the pastKeywordId where the keyword matches
//           Object.entries(data).forEach(([id, details]) => {
//             if (details.id === keyword) {
//               pastKeywordId = id;
//             }
//           });

//           if (pastKeywordId) {
//             setResult(snapshot.val());
//             router.push(`/keyword/${pastKeywordId}`);
//           } else {
//             const newUid = uuidv4();
//             const newKeywordRef = ref(
//               db,
//               `keyword-research-prompts/${userId}/${newUid}`
//             );

//             await set(newKeywordRef, {
//               id: keyword,
//               country,
//               date: currentDate,
//             });

//             setResult(snapshot.val());
//             router.push(`/keyword/${newUid}`);
//           }
//         } else {
//           console.log("No data available");
//         }
//       } else {
//         const response = await fetch("/api/keyword", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ keyword, country }),
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           throw new Error(errorData.error || "An unknown error occurred");
//         }

//         const data = await response.json();
//         const jsonData = data.analysisResult
//           .replace(/```[\w]*\n?|\n```/g, "")
//           .trim();
//         const parsedResult = JSON.parse(jsonData);
//         await set(keywordAnalysisRef, parsedResult);
//         if (checkSnapshot.exists()) {
//           const newKeywordRef = ref(
//             db,
//             `keyword-research-prompts/${userId}/${keywordId}`
//           );

//           await set(newKeywordRef, { id: keyword, country, date: currentDate });
//         }
//         setResult(parsedResult);
//         router.push(`/keyword/${keywordId}`);
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const toggleDropdown = () => {
//     setIsDropdownOpen((prevState) => !prevState);
//     if (!isDropdownOpen && inputRef.current) {
//       inputRef.current.focus();
//     }
//   };

//   // const handleCountrySelect = (value) => {
//   //   setCountry(value);
//   //   setCountrySearch("");
//   //   setIsDropdownOpen(false);
//   // };
//   const hasInitializedRef = useRef(false);

//   useEffect(() => {
//     if (!hasInitializedRef.current) {
//       const defaultLabel = countryOptions.find(
//         (option) => option.value === country
//       )?.label;
  
//       if (defaultLabel) {
//         setCountrySearch(defaultLabel);
//         hasInitializedRef.current = true;
//       }
//     }
//   }, [countryOptions, country]);

  
  
  
//   const handleCountrySelect = (value) => {
//     setCountry(value);
//     const selectedLabel = countryOptions.find((c) => c.value === value)?.label;
//     setCountrySearch(selectedLabel || "");
//     setIsDropdownOpen(false);
//   };
//   const handleCountrySearchChange = (e) => {
//     setCountrySearch(e.target.value);
//   };
  

//   const filteredCountries = countryOptions.filter((option) =>
//     option.label.toLowerCase().includes(countrySearch.toLowerCase())
//   );

//   const [menuOpen, setMenuOpen] = useState(false);
//   const [isDesktop, setIsDesktop] = useState(window.innerWidth > 800);

//   useEffect(() => {
//     const handleResize = () => {
//       setIsDesktop(window.innerWidth > 800);
//       if (window.innerWidth > 800) {
//         setMenuOpen(false); // Ensure menu closes when resizing to desktop mode
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     handleResize(); // Initialize state on mount

//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   useEffect(() => {
//     const adjustHeight = () => {
//       const viewportHeight = window.innerHeight;
//       const viewportWidth = window.innerWidth;

//       if (viewportWidth <= 600) {
//         document.querySelector(
//           ".keyword-generator"
//         ).style.height = `${viewportHeight}px`;
//       } else {
//         document.querySelector(".keyword-generator").style.height = "auto";
//       }
//     };

//     adjustHeight();
//     window.addEventListener("resize", adjustHeight);

//     return () => window.removeEventListener("resize", adjustHeight);
//   }, []);

//   const handleMenuOpen = () => {
//     setMenuOpen(!menuOpen);
//   };

//   const currentPath = "/keyword";
//   // const shouldShowKeyword = () => keyword && keywordPromptCount >= maxPrompts;

//   return (
//     <div className={`${styles.keywordGenerator} keyword-generator`}>
//       {/* <AiDashboard currentPath={currentPath}/> */}
//       {isDesktop && <AiDashboard />}

//       <div className={styles.keywordGeneratorContainer}>
//         <h1 className={styles.keywordGeneratorContainerHeading}>
//           Keyword Analysis
//         </h1>
//         <div className={styles.keywordGeneratorSearch}>
//           <h1>Improve your Organic Search Results</h1>
//           <div className={styles.keywordGeneratorSearchInput}>
//             <input
//               type="text"
//               id="keyword"
//               value={keyword}
//               onChange={(e) => setKeyword(e.target.value.toLowerCase())}
//               onKeyDown={(e) => e.key === "Enter" && analyzeKeyword()}
//               placeholder="Enter Keyword"
//               className={styles.keywordGeneratorSearchInputInput}
//             />

//             {/* Custom dropdown */}
//             {/* <div
//               className={styles.kgCountryDropdown}
//               onClick={toggleDropdown}
//               ref={dropdownRef}
//             >
//               <input
//                 type="text"
//                 value={
//                   countryOptions.find((option) => option.value === country)
//                     ?.label || ""
//                 }
//                 onChange={handleCountrySearchChange}
//                 placeholder={isDropdownOpen ? "Search Country" : ""}
//                 className={styles.kgCountryInput}
//                 ref={inputRef}
//               /> */}
//               <div className={styles.kgCountryDropdown} ref={dropdownRef}>
//                 <input
//                   type="text"
//                   value={countrySearch}
//                   onChange={handleCountrySearchChange}
//                   onFocus={() => setIsDropdownOpen(true)} // Open dropdown on input focus
//                   placeholder="Search Country"
//                   className={styles.kgCountryInput}
//                   ref={inputRef}
//                 />

//               {isDropdownOpen && (
//                 <div className={styles.kgCountryDropdownMenuContainer}>
//                   {filteredCountries.map(({ value, label }) => (
//                     <div
//                       key={value}
//                       className={styles.kgCountryDropdownItem}
//                       onClick={() => handleCountrySelect(value)}
//                     >
//                       {label}
//                     </div>
//                   ))}
//                 </div>
//               )}
//               <Image src={arrow} alt="Arrow" />
//             </div>

//             <div
//               className={`${styles.keywordGeneratorSearchInputButton} ${
//                 loading ? styles.loading : ""
//               }`}
//               onClick={analyzeKeyword}
//               disabled={!keyword || loading}
//             >
//               Search
//             </div>
//           </div>
//         </div>

//         {result && (
//           <div className={styles.keywordResultCanvas}>
//             {keyword && (
//               <h2
//                 style={{
//                   fontSize: "20px",
//                   fontFamily: "var(--h-font)",
//                   color: "var(--h-color)",
//                   fontWeight: "500",
//                 }}
//               >
//                 Keyword: {keyword}
//               </h2>
//             )}

//             <div className={styles.keywordResultTopCanvas}>
//               <div className={styles.keywordResultVolume}>
//                 <div className={styles.keywordResultVolumeContainer}>
//                   <div className={styles.keywordResultSearchVolume}>
//                     <p>Search Volume:</p>
//                     <span>{result["Search Volume"]}</span>
//                   </div>

//                   <div className={styles.keywordResultGlobalVolume}>
//                     <p>Location Breakdown</p>
//                     {Object.entries(
//                       result["Global Volume % with Countries"]
//                     ).map(([country, percent]) => (
//                       <div
//                         className={styles.keywordResultGlobalVolumeContents}
//                         key={country}
//                       >
//                         <div className={styles.globalVolumeBar}>
//                           <LinearProgress
//                             variant="determinate"
//                             value={parseFloat(String(percent).replace("%", ""))} // Remove "%" and convert to number
//                             sx={{
//                               height: 16,
//                               backgroundColor: "#ffffff",
//                               "& .MuiLinearProgress-bar": {
//                                 backgroundColor: "#515BD9",
//                               },
//                             }}
//                           />
//                         </div>
//                         <p>
//                           {country} ({percent})
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               <div className={styles.keywordTopTable}>
//                 <div className={styles.keywordTopTableScroll}>
//                   <table className={styles.keywordTopTableContainer}>
//                     <thead className={styles.keywordTopHead}>
//                       <tr className={styles.keywordTopRow}>
//                         <th className={styles.keywordTopRowContents}>
//                           Top Keywords
//                         </th>
//                         <th className={styles.keywordTopRowContents}>Volume</th>
//                         <th className={styles.keywordTopRowContents}>KD</th>
//                         <th className={styles.keywordTopRowContents}>Intent</th>
//                       </tr>
//                     </thead>
//                     <tbody className={styles.keywordTopBody}>
//                       {result["Top Similar Keywords"].map((keyword, index) => (
//                         <tr className={styles.keywordTopBodyRow} key={index}>
//                           <td className={styles.keywordTopBodyRowContents}>
//                             {keyword.Keyword}
//                           </td>
//                           <td className={styles.keywordTopBodyRowContents}>
//                             {keyword.Volume}
//                           </td>
//                           <td className={styles.keywordTopBodyRowContents}>
//                             {keyword.KD}%
//                           </td>
//                           <td className={styles.keywordTopBodyRowContents}>
//                             {keyword.Intent}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>

//             <div className={styles.keywordResultBottomCanvas}>
//               <div className={styles.keywordResultCpc}>
//                 <p className={styles.keywordResultCpcHeading}>CPC</p>
//                 <span className={styles.keywordResultCpcResult}>
//                   {result["Cost Per Click"]}%
//                 </span>
//               </div>
//               <div className={styles.keywordResultSeo}>
//                 <div className={styles.keywordResultSeoContents}>
//                   <p className={styles.keywordResultSeoHeading}>
//                     SEO difficulty
//                   </p>
//                   <span className={styles.keywordResultSeoResult}>
//                     {result["Keyword Difficulty"]}
//                   </span>
//                 </div>
//                 <CircularProgress
//                   variant="determinate"
//                   value={parseFloat(
//                     String(result["Keyword Difficulty"]).replace("%", "")
//                   )}
//                   size={80}
//                   thickness={22}
//                   style={{
//                     color: "#515BD9",
//                     backgroundColor: "#ffffff",
//                     borderRadius: "100%",
//                     width: "60px",
//                     height: "60px",
//                   }}
//                 />
//               </div>
//               <div className={styles.keywordResultCtr}>
//                 <p className={styles.keywordResultCtrHeading}>Organic CTR</p>
//                 <span className={styles.keywordResultCtrResult}>
//                   {result["Organic CTR"]}%
//                 </span>
//               </div>
//               <div className={styles.keywordResultIntent}>
//                 <p className={styles.keywordResultIntentHeading}>Intent</p>
//                 <span className={styles.keywordResultIntentResult}>
//                   {result["Intent Categorization"]}
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}
//         {error && <p className={styles.error}>Error: {error}</p>}
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useRef } from "react";
import styles from "@/styles/ai/KeywordAi.module.css";
import Image from "next/image";
import { database } from "@/firebase";
import { getDatabase, ref, set, get, push } from "firebase/database";
import { useKeyPrompt } from "@/context/keyword-prompt-context";
import useCountryList from "react-select-country-list"; // Import the country list hook
import arrow from "@/public/ai/drop.svg";
import AiDashboard from "@/components/global/Dashboard";
import LinearProgress from "@mui/material/LinearProgress";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

export default function KeywordGenerationAi({ contentId }) {
  const { keywordPromptCount, setKeywordPromptCount } = useKeyPrompt(); // Use the keyword prompt context
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("US"); // Default country set to 'US'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null); // Ref for the dropdown container
  const router = useRouter();
  const { user, isLoading } = useKindeBrowserClient();

  let planType = "free";
  let maxPrompts = 3;

  useEffect(() => {
    if (isLoading) return;
    const fetchKeywordData = async () => {
      if (!contentId) return;

      const userId = user.id;
      const db = getDatabase();

      try {
        // Fetch id and country from 'keyword-research-prompts/{userId}/{contentId}'
        const keywordRef = ref(
          db,
          `keyword-research-prompts/${userId}/${contentId}`
        );

        const keywordSnapshot = await get(keywordRef);

        if (!keywordSnapshot.exists()) {
          console.error("No keyword data found.");
          return;
        }

        const { id, country } = keywordSnapshot.val(); // Extract id and country
        const keywordAnalysisRef = ref(db, `keywords/${id}/${country}`);
        const analysisSnapshot = await get(keywordAnalysisRef);
        if (analysisSnapshot.exists()) {
          setResult(analysisSnapshot.val());
          setKeyword(id);
          setCountry(country); // <-- Ensure country is set when loading data
        } else {
          console.error("No analysis data found.");
        }
      } catch (error) {
        console.error("Error fetching keyword data:", error);
        setError(error.message);
      }
    };

    fetchKeywordData();
  }, [contentId, user]); // Runs when keywordId changes

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Close dropdown if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside); // Listen for clicks
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Cleanup listener on unmount
    };
  }, []);

  const countries = useCountryList(); // Use the hook to get country list
  const countryOptions = countries.getData().map((country) => ({
    label: country.label,
    value: country.value,
  }));
  const analyzeKeyword = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const userId = user.id;
    console.log("id", user.id)
    const db = getDatabase();
    const planRef = ref(db, `subscriptions/${userId}/planType`);
    const snapshot = await get(planRef);

    const keywordId = uuidv4();
    const currentDate = Date.now(); // (Stores full UTC timestamp)
    const keywordRef = ref(db, `keyword-research-prompts/${userId}/`);
    const checkSnapshot = await get(keywordRef);

    if (!checkSnapshot.exists()) {
      const checkKeywordRef = ref(
        db,
        `keyword-research-prompts/${userId}/${keywordId}`
      );
      await set(checkKeywordRef, { id: keyword, country, date: currentDate });
    }

    try {
      const keywordAnalysisRef = ref(
        database,
        `keywords/${keyword}/${country}`
      );
      const snapshot = await get(keywordAnalysisRef);

      if (snapshot.exists()) {
        const pastKeywordsRef = ref(db, `/keyword-research-prompts/${userId}/`);
        const pastSnapshot = await get(pastKeywordsRef);
        if (pastSnapshot.exists()) {
          const data = pastSnapshot.val();
          let pastKeywordId = null;

          // Find the pastKeywordId where the keyword matches
          Object.entries(data).forEach(([id, details]) => {
            if (details.id === keyword) {
              pastKeywordId = id;
            }
          });

          if (pastKeywordId) {
            setResult(snapshot.val());
            router.push(`/keyword/${pastKeywordId}`);
          } else {
            const newUid = uuidv4();
            const newKeywordRef = ref(
              db,
              `keyword-research-prompts/${userId}/${newUid}`
            );

            await set(newKeywordRef, {
              id: keyword,
              country,
              date: currentDate,
            });

            setResult(snapshot.val());
            router.push(`/keyword/${newUid}`);
          }
        } else {
          console.log("No data available");
        }
      } else {
        const response = await fetch("/api/keyword", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword, country }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "An unknown error occurred");
        }

        const data = await response.json();
        const jsonData = data.analysisResult
          .replace(/```[\w]*\n?|\n```/g, "")
          .trim();
        const parsedResult = JSON.parse(jsonData);
        await set(keywordAnalysisRef, parsedResult);
        if (checkSnapshot.exists()) {
          const newKeywordRef = ref(
            db,
            `keyword-research-prompts/${userId}/${keywordId}`
          );

          await set(newKeywordRef, { id: keyword, country, date: currentDate });
        }
        setResult(parsedResult);
        router.push(`/keyword/${keywordId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
    if (!isDropdownOpen && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // const handleCountrySelect = (value) => {
  //   setCountry(value);
  //   setCountrySearch("");
  //   setIsDropdownOpen(false);
  // };
  const hasInitializedRef = useRef(false);

  // useEffect(() => {
  //   if (!hasInitializedRef.current) {
  //     const defaultLabel = countryOptions.find(
  //       (option) => option.value === country
  //     )?.label;
  
  //     if (defaultLabel) {
  //       setCountrySearch(defaultLabel);
  //       hasInitializedRef.current = true;
  //     }
  //   }
  // }, [countryOptions, country]);

  useEffect(() => {
    const selectedLabel = countryOptions.find(
      (option) => option.value === country
    )?.label;
  
    if (selectedLabel && !isDropdownOpen) {
      setCountrySearch(selectedLabel);
    }
  }, [country, countryOptions, isDropdownOpen]);
  
  
  
  const handleCountrySelect = (value) => {
    setCountry(value);
    const selectedLabel = countryOptions.find((c) => c.value === value)?.label;
    setCountrySearch(selectedLabel || "");
    setIsDropdownOpen(false);
  };
  const handleCountrySearchChange = (e) => {
    setCountrySearch(e.target.value);
  };
  

  // const filteredCountries = countryOptions.filter((option) =>
  //   option.label.toLowerCase().includes(countrySearch.toLowerCase())
  // );
  const filteredCountries = countryOptions.filter((option) => {
    if (!isDropdownOpen) return false; // Don't show anything if dropdown isn't open
    if (countrySearch.trim() === "") return true; // If no search term, show all countries
    return option.label.toLowerCase().includes(countrySearch.toLowerCase()); // Filter by search term
  });
  
  

  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 800);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 800);
      if (window.innerWidth > 800) {
        setMenuOpen(false); // Ensure menu closes when resizing to desktop mode
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize state on mount

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const adjustHeight = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      if (viewportWidth <= 600) {
        document.querySelector(
          ".keyword-generator"
        ).style.height = `${viewportHeight}px`;
      } else {
        document.querySelector(".keyword-generator").style.height = "auto";
      }
    };

    adjustHeight();
    window.addEventListener("resize", adjustHeight);

    return () => window.removeEventListener("resize", adjustHeight);
  }, []);

  // const handleMenuOpen = () => {
  //   setMenuOpen(!menuOpen);
  // };
  const handleMenuOpen = () => {
    if (countrySearch.length > 0) {
      setCountrySearch(""); // Clear search so all options show
    }
  };
  
  const currentPath = "/keyword";
  // const shouldShowKeyword = () => keyword && keywordPromptCount >= maxPrompts;

  return (
    <div className={`${styles.keywordGenerator} keyword-generator`}>
      {/* <AiDashboard currentPath={currentPath}/> */}
      {isDesktop && <AiDashboard />}

      <div className={styles.keywordGeneratorContainer}>
        <h1 className={styles.keywordGeneratorContainerHeading}>
          Keyword Analysis
        </h1>
        <div className={styles.keywordGeneratorSearch}>
          <h1>Improve your Organic Search Results</h1>
          <div className={styles.keywordGeneratorSearchInput}>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && analyzeKeyword()}
              placeholder="Enter Keyword"
              className={styles.keywordGeneratorSearchInputInput}
            />

            {/* Custom dropdown */}
            {/* <div
              className={styles.kgCountryDropdown}
              onClick={toggleDropdown}
              ref={dropdownRef}
            >
              <input
                type="text"
                value={
                  countryOptions.find((option) => option.value === country)
                    ?.label || ""
                }
                onChange={handleCountrySearchChange}
                placeholder={isDropdownOpen ? "Search Country" : ""}
                className={styles.kgCountryInput}
                ref={inputRef}
              /> */}
              <div className={styles.kgCountryDropdown} ref={dropdownRef}>
              <input
              type="text"
              value={countrySearch}
              onChange={handleCountrySearchChange}
              onFocus={() => setIsDropdownOpen(true)} // Keep dropdown open when input is focused
              onBlur={() => setIsDropdownOpen(false)} // Close when input loses focus
              placeholder="Search Country"
              className={styles.kgCountryInput}
              ref={inputRef}
              />


              {isDropdownOpen && (
                <div className={styles.kgCountryDropdownMenuContainer}>
                  {filteredCountries.map(({ value, label }) => (
                    <div
                      key={value}
                      className={styles.kgCountryDropdownItem}
                      onClick={() => handleCountrySelect(value)}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              )}
              <Image src={arrow} alt="Arrow" />
            </div>

            <div
              className={`${styles.keywordGeneratorSearchInputButton} ${
                loading ? styles.loading : ""
              }`}
              onClick={analyzeKeyword}
              disabled={!keyword || loading}
            >
              Search
            </div>
          </div>
        </div>

        {result && (
          <div className={styles.keywordResultCanvas}>
            {keyword && (
              <h2
                style={{
                  fontSize: "20px",
                  fontFamily: "var(--h-font)",
                  color: "var(--h-color)",
                  fontWeight: "500",
                }}
              >
                Keyword: {keyword}
              </h2>
            )}

            <div className={styles.keywordResultTopCanvas}>
              <div className={styles.keywordResultVolume}>
                <div className={styles.keywordResultVolumeContainer}>
                  <div className={styles.keywordResultSearchVolume}>
                    <p>Search Volume:</p>
                    <span>{result["Search Volume"]}</span>
                  </div>

                  <div className={styles.keywordResultGlobalVolume}>
                    <p>Location Breakdown</p>
                    {Object.entries(
                      result["Global Volume % with Countries"]
                    ).map(([country, percent]) => (
                      <div
                        className={styles.keywordResultGlobalVolumeContents}
                        key={country}
                      >
                        <div className={styles.globalVolumeBar}>
                          <LinearProgress
                            variant="determinate"
                            value={parseFloat(String(percent).replace("%", ""))} // Remove "%" and convert to number
                            sx={{
                              height: 16,
                              backgroundColor: "#ffffff",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor: "#515BD9",
                              },
                            }}
                          />
                        </div>
                        <p>
                          {country} ({percent})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.keywordTopTable}>
                <div className={styles.keywordTopTableScroll}>
                  <table className={styles.keywordTopTableContainer}>
                    <thead className={styles.keywordTopHead}>
                      <tr className={styles.keywordTopRow}>
                        <th className={styles.keywordTopRowContents}>
                          Top Keywords
                        </th>
                        <th className={styles.keywordTopRowContents}>Volume</th>
                        <th className={styles.keywordTopRowContents}>KD</th>
                        <th className={styles.keywordTopRowContents}>Intent</th>
                      </tr>
                    </thead>
                    <tbody className={styles.keywordTopBody}>
                      {result["Top Similar Keywords"].map((keyword, index) => (
                        <tr className={styles.keywordTopBodyRow} key={index}>
                          <td className={styles.keywordTopBodyRowContents}>
                            {keyword.Keyword}
                          </td>
                          <td className={styles.keywordTopBodyRowContents}>
                            {keyword.Volume}
                          </td>
                          <td className={styles.keywordTopBodyRowContents}>
                            {keyword.KD}%
                          </td>
                          <td className={styles.keywordTopBodyRowContents}>
                            {keyword.Intent}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.keywordResultBottomCanvas}>
              <div className={styles.keywordResultCpc}>
                <p className={styles.keywordResultCpcHeading}>CPC</p>
                <span className={styles.keywordResultCpcResult}>
                  {result["Cost Per Click"]}%
                </span>
              </div>
              <div className={styles.keywordResultSeo}>
                <div className={styles.keywordResultSeoContents}>
                  <p className={styles.keywordResultSeoHeading}>
                    SEO difficulty
                  </p>
                  <span className={styles.keywordResultSeoResult}>
                    {result["Keyword Difficulty"]}
                  </span>
                </div>
                <CircularProgress
                  variant="determinate"
                  value={parseFloat(
                    String(result["Keyword Difficulty"]).replace("%", "")
                  )}
                  size={80}
                  thickness={22}
                  style={{
                    color: "#515BD9",
                    backgroundColor: "#ffffff",
                    borderRadius: "100%",
                    width: "60px",
                    height: "60px",
                  }}
                />
              </div>
              <div className={styles.keywordResultCtr}>
                <p className={styles.keywordResultCtrHeading}>Organic CTR</p>
                <span className={styles.keywordResultCtrResult}>
                  {result["Organic CTR"]}%
                </span>
              </div>
              <div className={styles.keywordResultIntent}>
                <p className={styles.keywordResultIntentHeading}>Intent</p>
                <span className={styles.keywordResultIntentResult}>
                  {result["Intent Categorization"]}
                </span>
              </div>
            </div>
          </div>
        )}
        {error && <p className={styles.error}>Error: {error}</p>}
      </div>
    </div>
  );
}


