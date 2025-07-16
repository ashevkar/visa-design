import React, { useRef, useState, useEffect } from 'react';
import {
  Button,
  Divider,
  Panel,
  Link,
  Nav,
  NavAppName,
  Typography,
  Utility,
  UtilityFragment,
  VisaLogo,
  Input,
  InputContainer,
  useFocusTrap,
} from '@visa/nova-react';
import {
  VisaCloseTiny,
  VisaNotesTiny,
  VisaWriteLow,
  VisaSearchLow,
  VisaDeleteLow,
  VisaEditLow,
  VisaCheckmarkLow,
} from '@visa/nova-icons-react';
import styles from './NavigationDrawer.module.css';
import LoadingSpinner from './LoadingSpinner';
import SearchChatsDialog from './SearchChatsDialog';


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function NavigationDrawer({
  onSelectHistory,
  onNewChat,
  showMobileButton = true,
  activeHistoryId,
  refreshToken,
  darkMode
}: {
  onSelectHistory?: (item: any) => void,
  onNewChat?: () => void,
  showMobileButton?: boolean,
  activeHistoryId?: string | null,
  refreshToken?: any,
  darkMode?: boolean
}) {
  const navDrawerRef = useRef<HTMLDialogElement>(null);
  const isMobile = useIsMobile();
  // const [drawerOpen, setDrawerOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { onKeyNavigation, ref: focusTrapRef } = useFocusTrap();

  // Fetch history from backend
  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3001/api/v1/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch history');
        console.error("Failed to fetch history.", err);
        setLoading(false);
      });
  }, [refreshToken]);

  // open/close logic for mobile only
  const openDrawer = () => {
    // setDrawerOpen(true);
    navDrawerRef.current?.showModal();
  };
  const closeDrawer = () => {
    // setDrawerOpen(false);
    navDrawerRef.current?.close();
  };

  useEffect(() => {
    if (!isMobile) return;
    const handler = () => openDrawer();
    window.addEventListener('openNavDrawer', handler);
    return () => window.removeEventListener('openNavDrawer', handler);
  }, [isMobile]);

  // delete history item by id
  const handleDeleteHistory = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/v1/history/${id}`, { method: 'DELETE' });
      setHistory(history => history.filter(item => item.id !== id));

      // if deleted item is currently open, refresh the page or reset the main view
      if (typeof window !== 'undefined') {
        if (onSelectHistory && activeHistoryId === id) {
          onNewChat?.();
        }
      }
    } catch (err) {
      alert('Failed to delete history item.' + err);
    }
  };

  // Rename history item by id
  const handleRenameHistory = async (id: string, newName: string) => {
    try {
      console.log('PATCH', id, newName);
      const response = await fetch(`http://localhost:3001/api/v1/history/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (!response.ok) {
        throw new Error('Failed to rename chat');
      }
      const data = await response.json();
      setHistory(history => history.map(item => item.id === id ? { ...item, name: data.item.name } : item));
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      alert(`Failed to rename chat.${err}`);
    }
  };

  // Helper: search filter
  const filteredHistory = searchValue.trim()
    ? history.filter(item => {
      const text = [item.name, item.prompt, item.snippet, ...(item.components || []).map((c: any) => typeof c === 'string' ? c : `${c.name} ${c.description || ''} ${(c.keywords || []).join(' ')}`)].join(' ').toLowerCase();
      return text.includes(searchValue.toLowerCase());
    })
    : history;

  // Sidebar content
  const drawerContent = (
    <div className={darkMode ? 'dark' : ''}>

    <Nav
      drawer
      orientation="vertical"
      tag="div"
      className={styles.drawerContent}
      id="nav-bar"
    >
      {!isMobile && (
        <div className={styles.spacer} />
      )}
      {isMobile && (
        <UtilityFragment vMarginRight={4} vMarginLeft="auto">
          <Button
            aria-label="Close"
            buttonSize="small"
            colorScheme="tertiary"
            iconButton
            onClick={closeDrawer}
            subtle
          >
            <VisaCloseTiny />
          </Button>
        </UtilityFragment>
      )}
      <UtilityFragment
        vFlex
        vFlexCol
        vGap={12}
        vMarginTop={4}
        vMarginRight={16}
        vMarginBottom={2}
        vMarginLeft={24}
      >
        {/* Use a div to wrap Link and Utility as a single child */}
        <div>
          <Link
            aria-label="Visa Home"
            href="https://www.visa.com"
            noUnderline
            style={{ backgroundColor: 'transparent' }}
          >
            <VisaLogo style={{ marginBottom: '10%' }} />
          </Link>
          <Utility vFlex vFlexCol vAlignSelf="stretch" vGap={4} vMarginTop={0}>
            <div style={{ marginBottom: '2%' }}>
              <Button
                colorScheme="secondary"
                onClick={() => {
                  if (onNewChat) onNewChat();
                  if (isMobile) closeDrawer();
                }}
                className={styles.newChatButton}
                type="button"
                id="new-chat-btn"
              >
                <VisaWriteLow className={styles.newChatButtonIcon} /> New Chat
              </Button>

              <Button
                colorScheme="secondary"
                onClick={() => setSearchDialogOpen(true)}
                className={styles.newChatButton}
                type="button"
                id="search-chats-btn"
              >
                <VisaSearchLow className={styles.newChatButtonIcon} /> Search Chats
              </Button>
            </div>
          </Utility>
        </div>
      </UtilityFragment>

      <Utility vFlex vFlexCol vAlignSelf="stretch" vGap={4} vMarginTop={0}>

        <Divider dividerType="decorative" />
        <NavAppName className={styles.navAppName}>
          <Typography variant="overline">Library</Typography>
        </NavAppName>

        {/* History List */}
        <div className={styles.historyList } >
          {loading ? (
            <LoadingSpinner message="Loading history..." />
          ) : error ? (
            <Typography variant="body-2" style={{ color: 'red' }}>{error}</Typography>
          ) : history.length === 0 ? (
            <Typography variant="body-2" style={{ marginLeft: '4%', marginTop: '4%' }}>No history yet.</Typography>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                className={`${styles.historyItem} ${darkMode ? styles.darkHover : styles.lightHover}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative',  }}
              >
                {/* Overlay textbox exactly on item */}
                {editingId === item.id ? (
                  <div className={styles.editOverlay}>
                    <InputContainer>
                      <Input
                        aria-required="true"
                        value={editValue}
                        maxLength={18}
                        onChange={e => setEditValue((e.target as HTMLInputElement).value)}
                        placeholder={item.name}
                        autoFocus
                        id={`edit-history-name-${item.id}`}
                        className={styles.editInput}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditValue('');
                          } else if (e.key === 'Enter') {
                            handleRenameHistory(item.id, editValue.trim() || item.name);
                          }
                        }}
                      />
                      <Button
                        aria-label="Save name"
                        buttonSize="small"
                        colorScheme="tertiary"
                        iconButton
                        onClick={() => handleRenameHistory(item.id, editValue.trim() || item.name)}
                      >
                        <VisaCheckmarkLow />
                      </Button>
                    </InputContainer>
                  </div>
                ) : (
                  <>
                    <div
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => {
                        if (onSelectHistory) onSelectHistory(item);
                        if (isMobile) closeDrawer();
                      }}
                    >
                      <Typography variant="body-2-bold">{item.name}</Typography>
                    </div>

                    {/* Edit button */}
                    <Button
                      aria-label="Edit history item"
                      buttonSize="small"
                      colorScheme="tertiary"
                      iconButton
                      onClick={e => {
                        e.stopPropagation();
                        setEditingId(item.id);
                        setEditValue(item.name);
                      }}
                      subtle
                      style={{ marginLeft: 4 }}
                    >
                      <VisaEditLow />
                    </Button>

                    {/* Delete button */}
                    <Button
                      aria-label="Delete history item"
                      buttonSize="small"
                      colorScheme="tertiary"
                      iconButton
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteHistory(item.id);
                      }}
                      subtle
                      style={{ marginLeft: 2 }}
                    >
                      <VisaDeleteLow style={{ color: '#ff4d4f' }} />
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Utility>
    </Nav>
    </div>
  );

  // Main return block
  return (
    <>
      {isMobile ? (
        <>
          {showMobileButton && (
            <UtilityFragment vMargin={10}>
              <Button onClick={openDrawer} aria-label="Open navigation drawer" colorScheme="tertiary">
                <VisaNotesTiny />
              </Button>
            </UtilityFragment>
          )}
          <UtilityFragment vMarginHorizontal={0}>
            <Panel
              aria-modal="true"
              ref={navDrawerRef}
              tag="dialog"
              style={{
                '--v-panel-inline-size': 'initial',
                left: 0,
                right: 'auto',
                minWidth: 260,
                maxWidth: 340,
                padding: 0,
              } as React.CSSProperties}
              onClick={e => {
                if (e.target === navDrawerRef.current) {
                  closeDrawer();
                }
              }}
            >
              {drawerContent}
            </Panel>
          </UtilityFragment>
        </>
      ) : (
        <div className={styles.sidebar}>
          {drawerContent}
        </div>
      )}
      <SearchChatsDialog
        open={searchDialogOpen}
        onClose={() => { setSearchDialogOpen(false); setSearchValue(''); }}
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        filteredHistory={filteredHistory}
        onSelectHistory={item => {
          if (onSelectHistory) onSelectHistory(item);
        }}
        focusTrapRef={focusTrapRef}
        onKeyNavigation={onKeyNavigation}
        onNewChat={() => { if (onNewChat) onNewChat(); setSearchDialogOpen(false); setSearchValue(''); }}
        darkMode={darkMode}
      />
    </>
  );
}