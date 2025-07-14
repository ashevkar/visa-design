import React, { useRef, useEffect } from 'react';
import {
    Dialog,
    DialogCloseButton,
    DialogContent,
    DialogHeader,
    Divider,
    Button,
} from '@visa/nova-react';
import { VisaMessageTiny, VisaWriteLow } from '@visa/nova-icons-react';
import styles from './SearchChatsDialog.module.css';

interface SearchChatsDialogProps {
    open: boolean;
    onClose: () => void;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    filteredHistory: any[];
    onSelectHistory: (item: any) => void;
    focusTrapRef: React.RefObject<HTMLDialogElement | null>;
    onKeyNavigation: (e: React.KeyboardEvent, open: boolean) => void;
    onNewChat: () => void;
    darkMode?: boolean;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const SearchChatsDialog: React.FC<SearchChatsDialogProps> = ({
    open,
    onClose,
    value,
    onChange,
    filteredHistory,
    onSelectHistory,
    focusTrapRef,
    onKeyNavigation,
    onNewChat,
    darkMode,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);
    const isMobile = useIsMobile();
    return (
        <>
            {open && (
                <div
                    className={styles.overlay}
                    onClick={e => {
                        if (e.target === e.currentTarget) {
                            onClose();  // close dialog if clicked outside the dialog (anywhere on the overlay)
                        }
                    }}
                >
                    <Dialog
                        aria-describedby="search-chats-desc"
                        aria-labelledby="search-chats-title"
                        id="search-chats-dialog"
                        ref={focusTrapRef}
                        open={open}
                        onKeyDown={e => onKeyNavigation(e, open)}
                        className={
                            isMobile
                                ? `${styles.dialog} ${styles['dialog-content']} ${styles['dialog-mobile']} ${darkMode ? styles['dialog-dark'] : ''}`
                                : darkMode
                                    ? `${styles.dialog} ${styles['dialog-dark']}`
                                    : styles.dialog
                        }
                    >
                        <DialogContent
                            className={styles['dialog-content']}
                        >
                            <DialogHeader id="search-chats-title" className={styles['dialog-header']}>
                                <input
                                    ref={inputRef}
                                    value={value}
                                    onChange={onChange}
                                    placeholder="Search chats..."
                                    className={darkMode ? `${styles['search-input']} ${styles['search-input-dark']}` : styles['search-input']}
                                    onKeyDown={e => {
                                        if (e.key === 'Escape') onClose();
                                    }}
                                />
                                <DialogCloseButton onClick={onClose} className={styles['close-btn']} />
                            </DialogHeader>
                            <Divider dividerType="decorative" />
                            {value.trim() === '' && (
                                <Button
                                    colorScheme="secondary"
                                    onClick={onNewChat}
                                    className={styles['new-chat-btn']}
                                    type="button"
                                >
                                    <VisaWriteLow style={{ marginRight: 8, opacity: 0.8 }} /> New Chat
                                </Button>
                            )}
                            <div className={styles['history-list']}>
                                {filteredHistory.length === 0 ? (
                                    <div className={styles['no-chats']}>No chats found.</div>
                                ) : (
                                    filteredHistory.map(item => (
                                        <div
                                            key={item.id}
                                            className={darkMode ? `${styles['chat-item']} ${styles['chat-item-dark']}` : styles['chat-item']}
                                            onClick={() => {
                                                onSelectHistory(item);
                                                onClose();
                                            }}
                                        >
                                            <VisaMessageTiny style={{ marginRight: 14, opacity: 0.7 }} />
                                            <span className={styles['chat-item-label']}>{item.name}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </>
    );
};

export default SearchChatsDialog;