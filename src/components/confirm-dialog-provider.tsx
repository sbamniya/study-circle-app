import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import * as React from 'react';

type ConfirmDialogOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
};

const ConfirmDialogContext = React.createContext<ConfirmDialogContextValue | null>(null);

const DEFAULT_OPTIONS: Required<Omit<ConfirmDialogOptions, 'title'>> = {
  description: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
};

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmDialogOptions | null>(null);
  const resolverRef = React.useRef<((confirmed: boolean) => void) | null>(null);

  const closeDialog = React.useCallback((confirmed: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    setOptions(null);
    resolver?.(confirmed);
  }, []);

  const confirm = React.useCallback((dialogOptions: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(dialogOptions);
      setOpen(true);
    });
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen && resolverRef.current) {
            closeDialog(false);
          }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title ?? 'Are you sure?'}</AlertDialogTitle>
            {options?.description ? (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={() => closeDialog(false)}>
              <Text>{options?.cancelText ?? DEFAULT_OPTIONS.cancelText}</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive active:bg-destructive/90"
              onPress={() => closeDialog(true)}>
              <Text className="text-white">{options?.confirmText ?? DEFAULT_OPTIONS.confirmText}</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = React.useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }

  return context.confirm;
}
