import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    type Option as SelectOption,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { ApiError, subjectsApi, type Note, type Subject } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

type AddNoteFormValue = {
  content: string;
  subjectId: string;
};

type AddNoteFormErrors = Partial<Record<keyof AddNoteFormValue, string>>;

function getInitialValues(editingNote?: Note | null): AddNoteFormValue {
  return {
    content: editingNote?.content ?? '',
    subjectId: editingNote?.subjectId ? String(editingNote.subjectId) : '',
  };
}

function toSelectOptions(subjects: Subject[]): SelectOption[] {
  return subjects.map((subject) => ({
    value: String(subject.id),
    label: subject.name,
  }));
}

function validateForm(values: AddNoteFormValue): AddNoteFormErrors {
  const errors: AddNoteFormErrors = {};

  if (!values.subjectId) {
    errors.subjectId = 'Subject is required.';
  }

  if (!values.content.trim()) {
    errors.content = 'Content is required.';
  }

  if (values.content.trim().length > 5000) {
    errors.content = 'Content must be 5000 characters or less.';
  }

  return errors;
}

export function AddNoteDialog({
  open,
  onOpenChange,
  editingNote,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingNote?: Note | null;
  onSubmit: (payload: {
    content: string;
    subjectId: number;
  }) => Promise<void>;
  submitting: boolean;
}) {
  const { token } = useAuth();
  const [values, setValues] = React.useState<AddNoteFormValue>(() => getInitialValues(editingNote));
  const [errors, setErrors] = React.useState<AddNoteFormErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = React.useState('');
  const [newSubjectError, setNewSubjectError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setValues(getInitialValues(null));
    setErrors({});
    setSubmitError(null);
    setNewSubjectName('');
    setNewSubjectError(null);
  }, []);

  const subjectsQuery = useQuery({
    queryKey: ['subjects', token],
    queryFn: async () =>
      subjectsApi.list(token as string, {
        page: 1,
        limit: 200,
      }),
    enabled: open && Boolean(token),
  });

  const subjectOptions = React.useMemo(
    () => toSelectOptions(subjectsQuery.data?.data ?? []),
    [subjectsQuery.data?.data]
  );

  const selectedSubject = subjectOptions.find((option) => option.value === values.subjectId) ?? null;

  const createSubjectMutation = useMutation({
    mutationFn: async (name: string) => {
      return subjectsApi.create(token as string, {
        name,
        description: '',
      });
    },
    onSuccess: async (subject) => {
      setValues((current) => ({
        ...current,
        subjectId: String(subject.id),
      }));
      setNewSubjectName('');
      setNewSubjectError(null);
      if (errors.subjectId) {
        setErrors((current) => ({ ...current, subjectId: undefined }));
      }
      await subjectsQuery.refetch();
    },
  });

  const onDialogOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm]
  );

  async function onCreateSubject() {
    const trimmedName = newSubjectName.trim();

    if (!trimmedName) {
      setNewSubjectError('Subject name is required.');
      return;
    }

    if (trimmedName.length > 100) {
      setNewSubjectError('Subject name must be 100 characters or less.');
      return;
    }

    const existingSubject = (subjectsQuery.data?.data ?? []).find(
      (subject) => subject.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingSubject) {
      setValues((current) => ({
        ...current,
        subjectId: String(existingSubject.id),
      }));
      setNewSubjectName('');
      setNewSubjectError(null);
      if (errors.subjectId) {
        setErrors((current) => ({ ...current, subjectId: undefined }));
      }
      return;
    }

    try {
      setNewSubjectError(null);
      await createSubjectMutation.mutateAsync(trimmedName);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to create subject right now.';
      setNewSubjectError(message);
    }
  }

  async function onFormSubmit() {
    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    setSubmitError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await onSubmit({
        content: values.content.trim(),
        subjectId: Number(values.subjectId),
      });
      onDialogOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to submit note right now.';
      setSubmitError(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent className="mt-auto max-h-[88%] w-full max-w-none rounded-b-none rounded-t-2xl px-5 pb-6 pt-5">
        <DialogHeader>
          <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
          <DialogDescription>
            Add a custom note for the selected subject.
          </DialogDescription>
        </DialogHeader>

        <ScrollView className="max-h-[70vh]" contentContainerStyle={{ gap: 12 }}>
          <View className="gap-2">
            <Label>Subject</Label>
            <Select
              value={selectedSubject}
              onValueChange={(option) => {
                setValues((current) => ({
                  ...current,
                  subjectId: option?.value ?? '',
                }));
                if (errors.subjectId) {
                  setErrors((current) => ({ ...current, subjectId: undefined }));
                }
              }}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    subjectsQuery.isLoading ? 'Loading subjects...' : 'Select subject'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {subjectOptions.map((subject) => (
                    <SelectItem
                      key={subject.value}
                      value={subject.value}
                      label={subject.label}
                    />
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.subjectId ? (
              <Text className="text-destructive text-xs">{errors.subjectId}</Text>
            ) : null}
            {subjectsQuery.isError ? (
              <Text className="text-destructive text-xs">
                Failed to load subjects. Pull to refresh and try again.
              </Text>
            ) : null}

            <View className="mt-2 gap-2 rounded-md border border-dashed border-border p-3">
              <Label htmlFor="new-note-subject-name">Create New Subject</Label>
              <View className="flex-row items-center gap-2">
                <Input
                  id="new-note-subject-name"
                  value={newSubjectName}
                  onChangeText={(text) => {
                    setNewSubjectName(text);
                    if (newSubjectError) {
                      setNewSubjectError(null);
                    }
                  }}
                  editable={!submitting && !createSubjectMutation.isPending}
                  placeholder="Type subject name"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onPress={onCreateSubject}
                  disabled={submitting || createSubjectMutation.isPending || subjectsQuery.isLoading}>
                  {createSubjectMutation.isPending ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Feather name="plus" size={16} color="#a3a3a3" />
                  )}
                  <Text>Create</Text>
                </Button>
              </View>
              {newSubjectError ? (
                <Text className="text-destructive text-xs">{newSubjectError}</Text>
              ) : (
                <Text className="text-muted-foreground text-xs">
                  Create and auto-select a new subject if it does not exist.
                </Text>
              )}
            </View>
          </View>

          <View className="gap-2">
            <Label htmlFor="note-content">Content</Label>
            <Input
              id="note-content"
              value={values.content}
              onChangeText={(text) => {
                setValues((current) => ({ ...current, content: text }));
                if (errors.content) {
                  setErrors((current) => ({ ...current, content: undefined }));
                }
              }}
              editable={!submitting}
              placeholder="Write your note"
              multiline
              numberOfLines={6}
              className="h-32 py-3"
              textAlignVertical="top"
            />
            {errors.content ? <Text className="text-destructive text-xs">{errors.content}</Text> : null}
          </View>

          {submitError ? <Text className="text-destructive text-sm">{submitError}</Text> : null}
        </ScrollView>

        <DialogFooter>
          <Button
            variant="outline"
            onPress={() => onDialogOpenChange(false)}
            disabled={submitting}>
            <Text>Cancel</Text>
          </Button>
          <Button onPress={onFormSubmit} disabled={submitting || subjectsQuery.isLoading}>
            {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : null}
            <Text>{submitting ? 'Submitting...' : 'Submit'}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
