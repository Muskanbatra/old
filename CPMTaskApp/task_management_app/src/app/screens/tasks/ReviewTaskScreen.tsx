import React from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, FeedbackCard, FieldLabel, FormCard, ScreenHeader } from '../../components';
import { COLORS } from '../../domain/model';
import { styles } from '../../theme/styles';
import type { ScreenRendererProps } from '../types';

type ReviewTaskScreenProps = Pick<
  ScreenRendererProps,
  | 'selectedTask'
  | 'goBack'
  | 'reviewComment'
  | 'setReviewComment'
  | 'handleReturnForChanges'
  | 'handleApproveTask'
  | 'handleSubmitForReview'
  | 'progressNotes'
>;

export function ReviewTaskScreen(props: ReviewTaskScreenProps) {
  const {
    selectedTask,
    goBack,
    reviewComment,
    setReviewComment,
    handleReturnForChanges,
    handleApproveTask,
    handleSubmitForReview,
    progressNotes,
  } = props;

  if (!selectedTask) {
    return null;
  }

  const isReviewer = selectedTask.status === 'under_review';
  const isRejected = selectedTask.status === 'rejected';

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.formScroll}>
        <ScreenHeader
          title={isRejected ? 'Rejected Task' : isReviewer ? 'Review Task' : 'Submit for Review'}
          onBack={goBack}
        />

        {isReviewer || isRejected ? (
          <View style={[styles.alertCard, isRejected ? styles.dangerAlert : styles.reviewAlert]}>
            <View
              style={[
                styles.alertIconWrap,
                isRejected ? styles.dangerAlertIconWrap : styles.reviewAlertIconWrap,
              ]}>
              <Text
                style={[
                  styles.alertIcon,
                  isRejected ? styles.dangerAlertIcon : styles.reviewAlertIcon,
                ]}>
                {isRejected ? '!' : '✓'}
              </Text>
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.alertTitle}>
                {isRejected ? 'Task Rejected' : 'Ready for Review'}
              </Text>
              <Text style={styles.alertText}>
                {isRejected
                  ? 'This task was rejected by the assignee.'
                  : 'This task has been completed and is waiting for your review.'}
              </Text>
            </View>
          </View>
        ) : null}

        <FormCard>
          <Text style={styles.detailsTitle}>{selectedTask.title}</Text>
          <Text style={styles.detailsDesc}>{selectedTask.description}</Text>
        </FormCard>

        {selectedTask.feedback ? (
          <FeedbackCard title="Previous Feedback" text={selectedTask.feedback} />
        ) : null}

        {selectedTask.reviewComment && (isReviewer || isRejected) ? (
          <FormCard>
            <FieldLabel label={isRejected ? 'Reject Reason' : 'Submission Note'} />
            <Text style={styles.noteText}>{selectedTask.reviewComment}</Text>
          </FormCard>
        ) : null}

        {!isRejected ? (
          <FormCard>
            <FieldLabel label={isReviewer ? 'Review Comments' : 'Add Comments'} />
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder={
                isReviewer
                  ? 'Provide feedback or approval comments'
                  : 'Describe what you completed for the reviewer'
              }
              placeholderTextColor={COLORS.textSoft}
              style={[styles.inputNoMargin, styles.textArea]}
              multiline
            />
          </FormCard>
        ) : null}

        {isReviewer ? (
          <View style={styles.rowGap}>
            <ActionButton
              title="Return for Changes"
              onPress={() => handleReturnForChanges(selectedTask.id, reviewComment)}
              variant="secondary"
              narrow
            />
            <ActionButton
              title="Approve Task"
              onPress={() => handleApproveTask(selectedTask.id)}
              variant="success"
              narrow
            />
          </View>
        ) : isRejected ? null : (
          <ActionButton
            title="Submit for Review"
            onPress={() =>
              handleSubmitForReview(selectedTask.id, reviewComment || progressNotes)
            }
            variant="primary"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
