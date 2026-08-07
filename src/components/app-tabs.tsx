import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

type TabIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const tabIcon = (name: TabIconName) => (
    <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name={name} />
  );

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcon('home')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="materials">
        <NativeTabs.Trigger.Label>Materials</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcon('file-document')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notes">
        <NativeTabs.Trigger.Label>Notes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcon('notebook')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="quizzes">
        <NativeTabs.Trigger.Label>Quizzes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcon('check-decagram')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="circles">
        <NativeTabs.Trigger.Label>Circles</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcon('account-group')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="more">
        <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={tabIcon('menu')} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
