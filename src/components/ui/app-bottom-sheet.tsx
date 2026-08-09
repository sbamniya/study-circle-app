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
  const sheetIndex = open ? 0 : -1;

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
      if (index === -1) {
        onOpenChange(false);
        return;
      }

      onOpenChange(true);
    },
    [onOpenChange]
  );

  const onSheetClose = React.useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <BottomSheet
      index={sheetIndex}
      snapPoints={memoizedSnapPoints}
      enablePanDownToClose={enablePanDownToClose}
      onChange={onSheetChange}
      onClose={onSheetClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={indicatorStyle}
      backgroundStyle={sheetBackgroundStyle}
      enableDynamicSizing
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
