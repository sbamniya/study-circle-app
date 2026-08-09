import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetScrollView,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

type AppBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  snapPoints?: (number | string)[];
  enablePanDownToClose?: boolean;
  backdropPressBehavior?: 'none' | 'close' | 'collapse';
  children: React.ReactNode;
};

export function AppBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  snapPoints = ['55%', '88%'],
  enablePanDownToClose = true,
  backdropPressBehavior = 'close',
  children,
}: AppBottomSheetProps) {
  const theme = useTheme();
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  const memoizedSnapPoints = React.useMemo(() => snapPoints, [snapPoints]);
  const sheetBackgroundStyle = React.useMemo(
    () => ({
      backgroundColor: theme.background,
      borderTopColor: theme.backgroundElement,
      borderTopWidth: StyleSheet.hairlineWidth,
    }),
    [theme.background, theme.backgroundElement]
  );
  const indicatorStyle = React.useMemo(
    () => ({
      backgroundColor: theme.textSecondary,
    }),
    [theme.textSecondary]
  );

  React.useEffect(() => {
    const sheet = bottomSheetRef.current;

    if (!sheet) {
      return;
    }

    if (open) {
      sheet.snapToIndex(0);
      return;
    }

    sheet.close();
  }, [open]);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={backdropPressBehavior}
      />
    ),
    [backdropPressBehavior]
  );

  const onSheetChange = React.useCallback(
    (index: number) => {
      onOpenChange(index >= 0);
    },
    [onOpenChange]
  );

  const onSheetClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={memoizedSnapPoints}
      enablePanDownToClose={enablePanDownToClose}
      onChange={onSheetChange}
      onClose={onSheetClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={indicatorStyle}
      backgroundStyle={sheetBackgroundStyle}
    >
      <BottomSheetView style={styles.contentContainer}>
        {title || description ? (
          <View style={styles.headerContainer}>
            {title ? <Text className="text-lg font-semibold">{title}</Text> : null}
            {description ? (
              <Text className="text-muted-foreground text-sm">{description}</Text>
            ) : null}
          </View>
        ) : null}
        <View style={styles.bodyContainer}>{children}</View>
      </BottomSheetView>
    </BottomSheet>
  );
}

export { BottomSheetScrollView as AppBottomSheetScrollView };

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 12,
  },
  headerContainer: {
    gap: 4,
  },
  bodyContainer: {
    flex: 1,
    minHeight: 0,
  },
});
