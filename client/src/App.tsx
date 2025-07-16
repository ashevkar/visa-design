import React, { useEffect, useState, useRef } from "react";
import {
  ContentCard,
  Textarea,
  Button,
  Typography,
  Footer,
  Utility,
  VisaLogo,
  Chip,
} from "@visa/nova-react";
import {
  VisaModeLightLow,
  VisaModeDarkLow,
  VisaArrowUpHigh,
  VisaLikeTiny,
  VisaLinkTiny,
  VisaCopyHigh,
  VisaCheckmarkHigh,
  VisaNotesTiny,
} from "@visa/nova-icons-react";
import { Bot } from "lucide-react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-terminal";
import './index.css';
import './App.css';
import NavigationDrawer from './components/NavigationDrawer';
import LoadingSpinner from './components/LoadingSpinner';
import TouringTipsDialog from './components/TouringTipsDialog';

const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour') === 'true';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function useSidebarWidth(isMobile: boolean) {
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useEffect(() => {
    if (isMobile) {
      setSidebarWidth(0);
      return;
    }
    // Get the value of the CSS variable
    const root = document.documentElement;
    const width = getComputedStyle(root).getPropertyValue("--sidebar-width");
    setSidebarWidth(parseInt(width) || 260);
  }, [isMobile]);

  return sidebarWidth;
}

const DARK_THEME_ID = "visa-nova-dark-theme";
const DARK_THEME_HREF =
  "/node_modules/@visa/nova-styles/themes/visa-dark/index.css";

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [textareaValue, setTextareaValue] = useState("");
  const [matchedComponents, setMatchedComponents] = useState<
    MatchedComponent[]
  >([]);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null); // Track if viewing a history chat
  const [refreshToken, setRefreshToken] = useState(0);
  const [showTour, setShowTour] = useState(!hasSeenTour);
  const [tourStep, setTourStep] = useState(0);
  const isMobile = useIsMobile();
  const sidebarWidth = useSidebarWidth(isMobile);

  useEffect(() => {
    const head = document.head;
    const existing = document.getElementById(DARK_THEME_ID);

    if (isDark) {
      if (!existing) {
        const link = document.createElement("link");
        link.id = DARK_THEME_ID;
        link.rel = "stylesheet";
        link.href = DARK_THEME_HREF;
        head.appendChild(link);
      }
    } else {
      if (existing) {
        existing.parentNode?.removeChild(existing);
      }
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  type MatchedComponent = {
    name: string;
    description?: string;
    keywords: string[];
    source?: string;
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleArrowClick = async () => {
    if (textareaRef.current) {
      const value = textareaRef.current.value;

      try {
        setLoading(true);

        // call getComponents API
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(
          `${API_BASE_URL}/api/v1/match-components`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: value }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `API request failed with status ${response.status}`
          );
        }
        const data = await response.json();
        setMatchedComponents(data.matches || []);
        console.log("Matched components:", data.matches);

        // call generate API & pass the matched components
        const generateResponse = await fetch(
           `${API_BASE_URL}/api/v1/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: value, components: data.matches }),
          }
        );
        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(
            errorData.error ||
              `API request failed with status ${generateResponse.status}`
          );
        }
        const generatedCode = await generateResponse.json();
        setGeneratedCode(generatedCode);
        console.log("Generated code:", generatedCode);
        setLoading(false);
      } catch (err) {
        console.error("Error matching/generating components:", err);
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (textareaValue) {
        handleArrowClick();
      }
    }
  };

  // Copy to clipboard handler
  type GeneratedCode = {
    result: string;
  };

  const handleCopyCode = () => {
    let code = "";
    if (generatedCode && typeof generatedCode.result === "string") {
      code = generatedCode.result;
    }
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // when tour finishes, set flag
  const handleCloseTour = () => {
    localStorage.setItem('hasSeenOnboardingTour', 'true');
    setShowTour(false);
    setTourStep(0);
  };

  return (
    <>
      {/* navigation drawer component */}
      <NavigationDrawer
        onSelectHistory={(item) => {
          //restore all UI state from history item
          setTextareaValue(item.prompt || "");
          setMatchedComponents(item.components || []);
          setGeneratedCode(item.snippet ? { result: item.snippet } : null);
          setActiveHistoryId(item.id || null);
        }}
        onNewChat={() => {
          setTextareaValue("");
          setMatchedComponents([]);
          setGeneratedCode(null);
          setActiveHistoryId(null);
          setRefreshToken((token) => token + 1);
        }}
        showMobileButton={false}
        refreshToken={refreshToken}
        darkMode={isDark}
      />
      <Typography variant="overline" className="main-heading">
        Visa Nova UI Generator
      </Typography>
      <div
        className={`app-root${isDark ? " dark" : ""}`}
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: "margin-left 0.2s",
        }}
      >
        {/* navBar button + dark mode toggle on mobile, only dark mode toggle on desktop */}
        {isMobile ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 12px 0 12px",
            }}
          >
            {/* NavBar button (drawer open) */}
            <Button id="search-chats-btn" onClick={() => {
              const event = new CustomEvent('openNavDrawer'); // open drawer by dispatching a custom event
              window.dispatchEvent(event);
            }} aria-label="Open navigation drawer" colorScheme="tertiary">
              <VisaNotesTiny />
            </Button>

            {/* dark mode toggle */}
            <Button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className='round-button'
            >
              {isDark ? <VisaModeLightLow /> : <VisaModeDarkLow />}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className='round-button'
            >
              {isDark ? <VisaModeLightLow /> : <VisaModeDarkLow />}
            </Button>
          </div>
        )}

        <Utility
          vElevation="small"
          vFlex
          vFlexCol
          vGap={24}
          style={{
            padding: "3%",
            margin: "5%",
            marginTop: "5%",
            borderRadius: "20px",
            backgroundColor: isDark ? "#1a1a1a" : "#f5f5f5",
          }}
        >
          <Typography variant="subtitle-2" className="centered-subtitle">
            Describe your desired UI and get{" "}
            <code className="code-block">@visa/nova-react</code> code instantly.
          </Typography>
          <ContentCard
          id="ui-description-textbox"
            style={{
              borderRadius: "25px",
              padding: "10px",
              border: "none",
              backgroundColor: isDark ? "#2c2c2c" : "#ffffff",
            }}
          >
            <div style={{ position: "relative" }}>
              {/* <InputContainer className="v-flex-row"style={{border:'none', backgroundColor: isDark ? '#2c2c2c' : '#ffffff', borderRadius:'255px'}}> */}
              <Textarea
                className="textarea"
                aria-required="true"
                fixed
                placeholder="Enter your UI description..."
                ref={textareaRef}
                value={textareaValue}
                onChange={(e) =>
                  setTextareaValue((e.target as HTMLTextAreaElement).value)
                }
                onKeyDown={handleKeyDown}
              />
              {/* </InputContainer> */}
              <div
                style={{ position: "absolute", bottom: "0px", right: "0px" }}
              >
                <Button
                  className="round-button"
                  onClick={handleArrowClick}
                  disabled={!textareaValue.trim() || !!activeHistoryId}
                >
                  <VisaArrowUpHigh style={{ transform: "scale(1.1)" }} />
                </Button>
              </div>
            </div>
          </ContentCard>

          {/* show results in a single column: chips at top, code/spinner below */}
          {matchedComponents.length > 0 ? (
            <Utility
              vFlex
              vFlexCol
              vGap={24}
              style={{ marginTop: 32, minHeight: 120 }}
            >
              {/* chips at the top */}
              <Utility
                vFlex
                vFlexRow
                vGap={8}
                className="result-chips-row"
                style={{ flexWrap: "wrap" }}
              >
                {matchedComponents.map((comp, idx) => (
                  <Chip key={comp.name + idx} className="chip">
                    <span className="chip-span">{comp.name}</span>
                    {comp.source && (
                      <a
                        href={comp.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chip-link"
                      >
                        <VisaLinkTiny />
                      </a>
                    )}
                  </Chip>
                ))}
              </Utility>

              {/* code/spinner below the chips */}
              <div className="generated-code-section" style={{ width: "100%" }}>
                {loading ? (
                  <LoadingSpinner message="Generating UI code..." />
                ) : (
                  generatedCode && (
                    <>
                      <div
                        className="generated-code-block"
                        style={{ position: "relative" }}
                      >
                        <Button
                          onClick={handleCopyCode}
                          className="copy-code-btn"
                        >
                          {copied ? <VisaCheckmarkHigh /> : <VisaCopyHigh />}
                        </Button>
                        <AceEditor
                          placeholder=""
                          mode="javascript"
                          theme="terminal"
                          name="generated-code-editor"
                          fontSize={14}
                          lineHeight={19}
                          showPrintMargin={true}
                          showGutter={true}
                          highlightActiveLine={true}
                          width="100%"
                          value={(() => {
                            let code = "";
                            if (
                              generatedCode &&
                              typeof generatedCode.result === "string"
                            ) {
                              code = generatedCode.result.trim();
                              if (code.startsWith("```javascript")) {
                                code = code
                                  .replace(/^```javascript\n/, "")
                                  .replace(/```$/, "")
                                  .trim();
                              } else if (code.startsWith("```")) {
                                code = code
                                  .replace(/^```\w*\n/, "")
                                  .replace(/```$/, "")
                                  .trim();
                              } else if (
                                code.startsWith("`") &&
                                code.endsWith("`") &&
                                code.length > 1 &&
                                !code.startsWith("```")
                              ) {
                                code = code.slice(1, -1).trim();
                              }
                              code = code.replace(/`/g, ""); // remove all backticks from the code
                            }
                            return code;
                          })()}
                          onChange={(val) => {
                            setGeneratedCode((generatedCode) => ({
                              ...generatedCode,
                              result: val,
                            }));
                          }}
                        />
                      </div>
                    </>
                  )
                )}
              </div>
            </Utility>
          ) : (
            <div className="centered-bot-section">
              <Bot size={48} className="bot-icon" />
              <Typography variant="body-1" className="bot-message">
                Your generated UI code will appear here.
              </Typography>
              <Typography variant="body-2" className="bot-message">
                Try an example like "A login form with email, password, and a
                submit button"
              </Typography>
            </div>
          )}
        </Utility>


        {/* Footer section */}
        <Footer className="custom-footer">
          <Utility
            vFlex
            vFlexRow
            vGap={30}
            vPadding={5}
            style={{ width: "100%" }}
          >
            <Utility
              vFlex
              vFlexCol
              vFlexGrow
              vFlexShrink
              vGap={10}
              style={{ flexBasis: "30%", paddingLeft: "5%", cursor: "pointer" }}
              onClick={() => window.open("https://design.visa.com", "_blank")}
            >
              <VisaLogo aria-label="Visa" style={{ width: 80, height: 40 }} />
              <Typography tag="h1" variant="body-1" style={{ color: "gray" }}>
                Copyright © 2025 Visa. All rights reserved.
              </Typography>
            </Utility>

            <Utility
              vFlex
              vFlexCol
              vFlexGrow
              vGap={16}
              style={{ flexBasis: "60%", alignSelf: "center" }}
            >
              <div style={{ flexGrow: 1, alignItems: "center" }}>
                <p>
                  To use the generated code, you must have{" "}
                  <code className="code-block">@visa/nova-react</code> installed
                  in your project.
                </p>
                {/* <p className="mt-1">
                  Run:{" "}
                  <code className="code-block">
                    npm install @visa/nova-react @visa/charts-react
                  </code>
                </p> */}
                <span>
                  Made with <VisaLikeTiny /> by Aishwarya Shevkar.
                </span>
              </div>
            </Utility>
          </Utility>
        </Footer>

        {/* Touring Tips Dialog */}
        <TouringTipsDialog
          open={showTour}
          step={tourStep}
          onClose={handleCloseTour}
          onNext={() => setTourStep(s => Math.min(s + 1, 5))}
          onPrev={() => setTourStep(s => Math.max(s - 1, 0))}
        />
      </div>
    </>
  );
}
