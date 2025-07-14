import { ProgressCircular, Typography, Utility } from '@visa/nova-react';

export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <Utility vFlex vFlexCol vAlignItems="center" vJustifyContent="center" style={{ minHeight: 80 }}>
      <ProgressCircular indeterminate />
      {message && (
        <Typography variant="body-1" style={{ marginTop: 16, textAlign: 'center' }}>{message}</Typography>
      )}
    </Utility>
  );
}