import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ActionButton, FieldLabel, FormCard } from '../../../components';
import { COLORS } from '../../../domain/model';
import { styles } from '../../../theme/styles';
import type { TaskForm } from '../../types';

export function ManageTaskFormSection({
  isEditing,
  taskForm,
  setTaskForm,
  taskFormErrors,
  onTitleChange,
  getUserName,
  onOpenDatePicker,
  onOpenTimePicker,
  onOpenAssignPicker,
  onSubmit,
  isSavingTask,
  taskActionError,
}: {
  isEditing: boolean;
  taskForm: TaskForm;
  setTaskForm: React.Dispatch<React.SetStateAction<TaskForm>>;
  taskFormErrors: {
    title?: string;
    dueDate?: string;
    dueTime?: string;
    assignedTo?: string;
  };
  onTitleChange: (value: string) => void;
  getUserName: (userId: string) => string;
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
  onOpenAssignPicker: () => void;
  onSubmit: () => void;
  isSavingTask: boolean;
  taskActionError: string;
}) {
  return (
    <>
      <FormCard>
        <FieldLabel label="Task Title" />
        <TextInput
          value={taskForm.title}
          onChangeText={onTitleChange}
          placeholder="Enter task title"
          placeholderTextColor={COLORS.textSoft}
          style={styles.inputNoMargin}
        />
        {taskFormErrors.title ? (
          <Text style={styles.inlineFieldError}>{taskFormErrors.title}</Text>
        ) : null}
      </FormCard>

      <FormCard>
        <FieldLabel label="Description" />
        <TextInput
          value={taskForm.description}
          onChangeText={value => setTaskForm(prev => ({ ...prev, description: value }))}
          placeholder="Describe the task..."
          placeholderTextColor={COLORS.textSoft}
          style={[styles.inputNoMargin, styles.manageTextArea]}
          multiline
        />
      </FormCard>

        <FormCard half>
          <FieldLabel label="Due Date" />
          <Pressable onPress={onOpenDatePicker} style={styles.pickerField}>
            <Text
              style={[
                styles.pickerFieldText,
                !taskForm.dueDate && styles.pickerFieldPlaceholder,
              ]}>
              {taskForm.dueDate || 'Select date'}
            </Text>
          </Pressable>
          {taskFormErrors.dueDate ? (
            <Text style={styles.inlineFieldError}>{taskFormErrors.dueDate}</Text>
          ) : null}
        </FormCard>
        <FormCard half>
          <FieldLabel label="Task Time" />
          <Pressable onPress={onOpenTimePicker} style={styles.pickerField}>
            <Text
              style={[
                styles.pickerFieldText,
                !taskForm.dueTime && styles.pickerFieldPlaceholder,
              ]}>
              {taskForm.dueTime || 'Select time'}
            </Text>
          </Pressable>
          {taskFormErrors.dueTime ? (
            <Text style={styles.inlineFieldError}>{taskFormErrors.dueTime}</Text>
          ) : null}
        </FormCard>
     

      <FormCard>
        <FieldLabel label="Assign To" />
        <Pressable onPress={onOpenAssignPicker} style={styles.selectField}>
          <Text
            style={[
              styles.selectFieldText,
              !taskForm.assignedTo && styles.pickerFieldPlaceholder,
            ]}>
            {taskForm.assignedTo ? getUserName(taskForm.assignedTo) : 'Select team member'}
          </Text>
          <Text style={styles.selectFieldArrow}>⌄</Text>
        </Pressable>
        {taskFormErrors.assignedTo ? (
          <Text style={styles.inlineFieldError}>{taskFormErrors.assignedTo}</Text>
        ) : null}
      </FormCard>

      <ActionButton
        title={
          isSavingTask
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save Changes'
              : 'Create Task'
        }
        onPress={onSubmit}
        variant="primary"
      />
      {taskActionError ? <Text style={styles.formErrorText}>{taskActionError}</Text> : null}
      <View style={styles.bottomSpacer} />
    </>
  );
}
