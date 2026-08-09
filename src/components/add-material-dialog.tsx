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
import { ApiError, subjectsApi, type Subject } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
};

type AddMaterialFormValue = {
  title: string;
  description: string;
  subjectId: string;
  file: PickedFile | null;
};

type AddMaterialFormErrors = Partial<Record<keyof AddMaterialFormValue, string>>;

function toSelectOptions(subjects: Subject[]): SelectOption[] {
  return subjects.map((subject) => ({
    value: subject.id,
    label: subject.name,
  }));
}

function validateForm(values: AddMaterialFormValue): AddMaterialFormErrors {
  const errors: AddMaterialFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Title is required.';
  }

  if (values.title.trim().length > 100) {
    errors.title = 'Title must be 100 characters or less.';
  }

  if (values.description.trim().length > 1000) {
    errors.description = 'Description must be 1000 characters or less.';
  }

  if (!values.subjectId) {
    errors.subjectId = 'Subject is required.';
  }

  if (!values.file) {
    errors.file = 'At least one file is required.';
  } else if (typeof values.file.size === 'number' && values.file.size > MAX_FILE_SIZE_BYTES) {
    errors.file = 'File size must be 10MB or less.';
  }

  return errors;
}

export function AddMaterialDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    subjectId: string;
    file: {
      uri: string;
      name: string;
      type: string;
    };
  }) => Promise<void>;
  submitting: boolean;
}) {
  const { token } = useAuth();
  const [values, setValues] = React.useState<AddMaterialFormValue>({
    title: '',
    description: '',
    subjectId: '',
    file: null,
  });
  const [errors, setErrors] = React.useState<AddMaterialFormErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = React.useState('');
  const [newSubjectError, setNewSubjectError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setValues({
      title: '',
      description: '',
      subjectId: '',
      file: null,
    });
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
        subjectId: subject.id,
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

  async function onPickFile() {
    setSubmitError(null);

    const result = await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/*',
      ],
    });

    if (result.canceled) {
      return;
    }

    const picked = result.assets[0];
    const nextFile: PickedFile = {
      uri: picked.uri,
      name: picked.name,
      mimeType: picked.mimeType ?? 'application/octet-stream',
      size: picked.size ?? null,
    };

    setValues((current) => ({
      ...current,
      file: nextFile,
    }));

    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors.file;
      return nextErrors;
    });
  }

  async function onFormSubmit() {
    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    setSubmitError(null);

    if (Object.keys(validationErrors).length > 0 || !values.file) {
      return;
    }

    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        subjectId: values.subjectId,
        file: {
          uri: values.file.uri,
          name: values.file.name,
          type: values.file.mimeType,
        },
      });
      onDialogOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to create study material right now.';
      setSubmitError(message);
    }
  }

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
        subjectId: existingSubject.id,
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

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent className="mt-auto max-h-[88%] w-full max-w-none rounded-b-none rounded-t-2xl px-5 pb-6 pt-5">
        <DialogHeader>
          <DialogTitle>Add Study Material</DialogTitle>
          <DialogDescription>
            Upload one study file with title, optional description, and subject.
          </DialogDescription>
        </DialogHeader>

        <ScrollView className="max-h-[70vh]" contentContainerStyle={{ gap: 12 }}>
          <View className="gap-2">
            <Label htmlFor="material-title">Title</Label>
            <Input
              id="material-title"
              value={values.title}
              onChangeText={(text) => {
                setValues((current) => ({ ...current, title: text }));
                if (errors.title) {
                  setErrors((current) => ({ ...current, title: undefined }));
                }
              }}
              editable={!submitting}
              placeholder="Study Material Title"
            />
            {errors.title ? <Text className="text-destructive text-xs">{errors.title}</Text> : null}
          </View>

          <View className="gap-2">
            <Label htmlFor="material-description">Description (Optional)</Label>
            <Input
              id="material-description"
              value={values.description}
              onChangeText={(text) => {
                setValues((current) => ({ ...current, description: text }));
                if (errors.description) {
                  setErrors((current) => ({ ...current, description: undefined }));
                }
              }}
              editable={!submitting}
              placeholder="Study material description"
              multiline
              numberOfLines={4}
              className="h-24 py-3"
              textAlignVertical="top"
            />
            {errors.description ? (
              <Text className="text-destructive text-xs">{errors.description}</Text>
            ) : null}
          </View>

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
              <Label htmlFor="new-subject-name">Create New Subject</Label>
              <View className="flex-row items-center gap-2">
                <Input
                  id="new-subject-name"
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
            <Label>Study Material File</Label>
            <Pressable
              onPress={onPickFile}
              disabled={submitting}
              className="border-border bg-background active:bg-accent/50 flex-row items-center justify-between rounded-md border px-3 py-3">
              <View className="flex-1 pr-2">
                <Text className="text-sm font-medium">
                  {values.file ? values.file.name : 'Pick a file'}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  PDF, DOC, DOCX, TXT, or image up to 10MB.
                </Text>
              </View>
              <Feather name="upload" size={16} color="#a3a3a3" />
            </Pressable>
            {values.file?.size ? (
              <Text className="text-muted-foreground text-xs">
                Size: {(values.file.size / (1024 * 1024)).toFixed(2)} MB
              </Text>
            ) : null}
            {errors.file ? <Text className="text-destructive text-xs">{errors.file}</Text> : null}
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
