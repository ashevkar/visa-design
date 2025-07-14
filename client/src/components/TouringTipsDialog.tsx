import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  Typography,
  useFocusTrap,
  Utility,
} from '@visa/nova-react';
import styles from './TouringTipsDialog.module.css';

const TOUR_ID = 'touring-tips-dialog';

const tourSteps = [
  {
    title: 'Describe your UI',
    description: 'Type your UI requirements here to get code suggestions.',
    target: '#ui-description-textbox',
  },
  {
    title: 'Navigation Bar',
    description: 'Access your chat history and actions from the sidebar.',
    target: '#nav-bar',
  },
  {
    title: 'New Chat',
    description: 'Start a new chat session with this button.',
    target: '#new-chat-btn',
  },
  {
    title: 'Search Chats',
    description: 'Search anything from your past chats using this search.',
    target: '#search-chats-btn',
  },
  {
    title: 'Library Item',
    description: 'Edit or delete a chat from your history here.',
    target: '.history-item',
  },
  {
    title: 'Theme Toggle',
    description: 'Switch between light and dark mode.',
    target: '#theme-toggle-btn',
  },
];

type TouringTipsDialogProps = {
  open: boolean;
  step: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export default function TouringTipsDialog({
  open,
  step,
  onClose,
  onNext,
  onPrev,
}: TouringTipsDialogProps) {
  const { onKeyNavigation, ref } = useFocusTrap();
  const currentStep = tourSteps[step];
  const [cutout, setCutout] = useState<{left: number, top: number, width: number, height: number} | null>(null);

  // highlight the target element for the current step and update cutout
  useEffect(() => {
    if (!currentStep?.target || !open) return;
    let el: Element | null = null;
    const highlight = () => {

      // For .history-item, highlight the first one
      if (currentStep.target === '.history-item') {
        el = document.querySelectorAll(currentStep.target)[1] || document.querySelectorAll(currentStep.target)[1] || null;
      } else {
        el = document.querySelector(currentStep.target);
      }
      if (el) {
        el.classList.add(styles.tourHighlight);
        (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // delay to ensure DOM is ready
    const timeout = setTimeout(highlight, 50);
    return () => {
      clearTimeout(timeout);
      if (el) el.classList.remove(styles.tourHighlight);
    };
  }, [step, currentStep, open]);

  // remove highlight from all/any element if dialog is closed
  useEffect(() => {
    if (open) return;
    const highlighted = document.querySelectorAll(`.${styles.tourHighlight}`);
    highlighted.forEach(el => el.classList.remove(styles.tourHighlight));
  }, [open]);

  // backdrop logic
  useEffect(() => {
    if (!currentStep?.target) return;
    let el: Element | null = null;
    const updateCutout = () => {
      if (currentStep.target === '.history-item') {
        el = document.querySelectorAll(currentStep.target)[0] || null;
      } else {
        el = document.querySelector(currentStep.target);
      }
      if (el) {
        const rect = (el as HTMLElement).getBoundingClientRect();
        setCutout({
          left: rect.left + window.scrollX,
          top: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setCutout(null);
      }
    };
    updateCutout();
    window.addEventListener('resize', updateCutout);
    window.addEventListener('scroll', updateCutout, true);
    return () => {
      window.removeEventListener('resize', updateCutout);
      window.removeEventListener('scroll', updateCutout, true);
    };
  }, [step, currentStep]);

  // render backdrop with a cutout
  const Backdrop = () => {
    if (!cutout) return null;
    const { left, top, width, height } = cutout;

    // CSS mask to create a transparent cutout
    const maskStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1200,
      left: 0,
      top: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      background: 'rgba(0,0,0,0.5)',
      WebkitMaskImage: `inset(${top}px calc(100vw - ${left + width}px) calc(100vh - ${top + height}px) ${left}px)`,
      maskImage: `inset(${top}px calc(100vw - ${left + width}px) calc(100vh - ${top + height}px) ${left}px)`,
      transition: 'mask-image 0.2s, -webkit-mask-image 0.2s',
    };
    return <div className="tour-backdrop" style={maskStyle} />;
  };

  const isFloatingStep = [1, 2, 3, 4].includes(step) && cutout;
  const shouldShowBackdrop = open && cutout;


  return (
    <>
      {shouldShowBackdrop && <Backdrop />}
      <Dialog
        aria-describedby={`${TOUR_ID}-description`}
        aria-labelledby={`${TOUR_ID}-title`}
        ref={ref}
        id={TOUR_ID}
        open={open}
        onKeyDown={e => onKeyNavigation(e, ref.current?.open)}
        style={{ zIndex: 1300 }}
        className={isFloatingStep ? styles.floatingDialog : undefined}
      >
        <DialogContent>
          <DialogHeader id={`${TOUR_ID}-title`}>
            {currentStep.title}
          </DialogHeader>
          <Typography id={`${TOUR_ID}-description`}>
            {currentStep.description}
          </Typography>
          <Utility vAlignItems="center" vFlex vFlexWrap vGap={8} vJustifyContent="between" vPaddingTop={16}>
            <Typography>{step + 1} of {tourSteps.length}</Typography>
            <Utility vFlex vFlexWrap vGap={8} vJustifyContent="between">
              <Button colorScheme="secondary" onClick={onPrev} disabled={step === 0}>
                Previous
              </Button>
              {step < tourSteps.length - 1 ? (
                <Button onClick={onNext}>Next</Button>
              ) : (
                <Button onClick={onClose}>Finish</Button>
              )}
            </Utility>
          </Utility>
        </DialogContent>
        <DialogCloseButton onClick={onClose} />
      </Dialog>
    </>
  );
}