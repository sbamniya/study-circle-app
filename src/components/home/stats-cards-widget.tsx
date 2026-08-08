import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { useQueries } from '@tanstack/react-query';
import { View } from 'react-native';

export type StatCardItem = {
  id: string;
  title: string;
  value: number;
  hint: string;
};

export function StatsCardsWidget({
}: Record<string, never>) {
  const { token } = useAuth();
  const dashboardQueries = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'count', 'study-materials', token],
        queryFn: async () => dashboardApi.getStudyMaterialsCount(token as string),
        enabled: Boolean(token),
      },
      {
        queryKey: ['dashboard', 'count', 'exam-materials', token],
        queryFn: async () => dashboardApi.getExamMaterialsCount(token as string),
        enabled: Boolean(token),
      },
      {
        queryKey: ['dashboard', 'count', 'quizzes', token],
        queryFn: async () => dashboardApi.getQuizzesCount(token as string),
        enabled: Boolean(token),
      },
      {
        queryKey: ['dashboard', 'count', 'study-circles', token],
        queryFn: async () => dashboardApi.getStudyCirclesCount(token as string),
        enabled: Boolean(token),
      },
    ],
  });

  const [studyMaterialsQuery, examMaterialsQuery, quizzesQuery, studyCirclesQuery] = dashboardQueries;
  const isLoading = dashboardQueries.some((query) => query.isLoading);

  const cards: StatCardItem[] = [
    {
      id: 'study-materials',
      title: 'Uploaded Study Materials',
      value: studyMaterialsQuery.data ?? 0,
      hint: 'Study materials uploaded by you',
    },
    {
      id: 'exam-materials',
      title: 'Uploaded Exam Materials',
      value: examMaterialsQuery.data ?? 0,
      hint: 'Exam materials uploaded by you',
    },
    {
      id: 'quizzes',
      title: 'Available Quizzes',
      value: quizzesQuery.data ?? 0,
      hint: 'Quizzes created by StudyCircleAI for you',
    },
    {
      id: 'study-circles',
      title: 'Study Circles Joined',
      value: studyCirclesQuery.data ?? 0,
      hint: 'Circles you are a member of',
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <Card key={card.id} className="gap-2 py-3">
          <CardHeader className="gap-2 px-4">
            <View className="flex-row items-center justify-between">
              <CardDescription className="text-sm">{card.title}</CardDescription>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-semibold">View</Text>
                <Feather name="external-link" size={14} color="#a3a3a3" />
              </View>
            </View>
            <CardTitle className="text-4xl leading-none">{isLoading ? '-' : card.value}</CardTitle>
            <Text className="text-muted-foreground text-sm font-medium">{card.hint}</Text>
          </CardHeader>
        </Card>
      ))}
    </>
  );
}
