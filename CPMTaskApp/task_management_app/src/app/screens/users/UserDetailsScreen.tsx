import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BottomNav,
  EmptyState,
  GradientSurface,
  InfoRow,
  ScreenHeader,
  SectionCard,
  TaskCard,
} from '../../components';
import { Task, User } from '../../domain/model';
import { styles } from '../../theme/styles';
import type { ScreenRendererProps } from '../types';

type UserDetailsScreenProps = Pick<
  ScreenRendererProps,
  | 'selectedUser'
  | 'users'
  | 'tasks'
  | 'goBack'
  | 'renderDashboardNavItem'
  | 'getUserName'
>;

type UserTaskTab = 'active' | 'pending' | 'review' | 'completed';

const TASKS_PER_PAGE = 10;

const TASK_TAB_LABELS: Record<UserTaskTab, string> = {
  active: 'Active Task',
  pending: 'Pending Task',
  review: 'Review Task',
  completed: 'Done Task',
};

function formatTaskStatus(status: Task['status']) {
  return status.replace('_', ' ');
}

function getUserTaskIdentityKeys(selectedUser: User | null, users: User[]) {
  if (!selectedUser) {
    return new Set<string>();
  }

  const userEmail = selectedUser.email.toLowerCase();
  const relatedUsers = users.filter(
    user =>
      user.id === selectedUser.id ||
      user.id === selectedUser.backendId ||
      user.backendId === selectedUser.id ||
      user.backendId === selectedUser.backendId ||
      user.email.toLowerCase() === userEmail,
  );

  return new Set(
    [selectedUser, ...relatedUsers]
      .flatMap(user => [user.id, user.backendId])
      .filter((value): value is string => Boolean(value?.trim())),
  );
}

function escapeSpreadsheetCell(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizePdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function encodeBase64(value: string) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let index = 0;

  while (index < value.length) {
    const chr1 = value.charCodeAt(index++);
    const chr2 = value.charCodeAt(index++);
    const chr3 = value.charCodeAt(index++);
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    const enc3 = Number.isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
    const enc4 = Number.isNaN(chr3) ? 64 : chr3 & 63;

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }

  return output;
}

function createSimplePdf(lines: string[]) {
  const safeLines = lines.slice(0, 34).map(sanitizePdfText);
  const textCommands = safeLines
    .map((line, index) => `1 0 0 1 40 ${760 - index * 20} Tm (${line}) Tj`)
    .join('\n');
  const stream = `BT\n/F1 11 Tf\n${textCommands}\nET`;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach(object => {
    offsets.push(pdf.length);
    pdf += object;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export function UserDetailsScreen(props: UserDetailsScreenProps) {
  const { selectedUser, users, tasks, goBack, renderDashboardNavItem, getUserName } = props;
  const [activeTaskTab, setActiveTaskTab] = useState<UserTaskTab>('active');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskPage, setTaskPage] = useState(1);

  const userTasks = useMemo(
    () => {
      const selectedUserKeys = getUserTaskIdentityKeys(selectedUser, users);

      return tasks.filter(task => selectedUserKeys.has(task.assignedTo));
    },
    [selectedUser, tasks, users],
  );

  const groupedTasks = useMemo(
    () => ({
      active: userTasks.filter(task => task.status === 'in_progress'),
      pending: userTasks.filter(task => task.status === 'pending'),
      review: userTasks.filter(
        task => task.status === 'under_review' || task.status === 'rejected',
      ),
      completed: userTasks.filter(task => task.status === 'completed'),
    }),
    [userTasks],
  );

  const taskCounts = {
    active: groupedTasks.active.length,
    pending: groupedTasks.pending.length,
    review: groupedTasks.review.length,
    completed: groupedTasks.completed.length,
  };

  const visibleTasks = groupedTasks[activeTaskTab];
  const normalizedSearchQuery = taskSearchQuery.trim().toLowerCase();
  const filteredTasks = normalizedSearchQuery
    ? visibleTasks.filter(task => {
        const searchableText = [
          task.title,
          task.description,
          task.dueDate,
          task.dueTime,
          task.status,
          task.reviewComment,
          task.feedback,
          getUserName(task.assignedBy),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
      })
    : visibleTasks;
  const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const currentTaskPage = Math.min(taskPage, totalTaskPages);
  const paginatedTasks = filteredTasks.slice(
    (currentTaskPage - 1) * TASKS_PER_PAGE,
    currentTaskPage * TASKS_PER_PAGE,
  );

  const handleTaskTabPress = (tab: UserTaskTab) => {
    setActiveTaskTab(tab);
    setTaskSearchQuery('');
    setTaskPage(1);
  };

  const handleSearchChange = (value: string) => {
    setTaskSearchQuery(value);
    setTaskPage(1);
  };

  const buildReportRows = () =>
    (Object.keys(TASK_TAB_LABELS) as UserTaskTab[]).flatMap(tab =>
      groupedTasks[tab].length
        ? groupedTasks[tab].map(task => ({
            bucket: TASK_TAB_LABELS[tab],
            title: task.title,
            status: formatTaskStatus(task.status),
            due: [task.dueDate, task.dueTime].filter(Boolean).join(' '),
            assignedBy: getUserName(task.assignedBy),
          }))
        : [
            {
              bucket: TASK_TAB_LABELS[tab],
              title: 'No tasks',
              status: '',
              due: '',
              assignedBy: '',
            },
          ],
    );

  const openReportFile = async (filename: string, mimeType: string, data: string, base64 = false) => {
    const href = `data:${mimeType}${base64 ? ';base64' : ''},${
      base64 ? data : encodeURIComponent(data)
    }`;

    try {
      await Linking.openURL(href);
    } catch {
      Alert.alert('Download failed', `Could not open ${filename}.`);
    }
  };

  const downloadUserReport = async (format: 'xls' | 'pdf') => {
    if (!selectedUser) {
      return;
    }

    const rows = buildReportRows();
    const filenameBase = `${selectedUser.name.replace(/\s+/g, '-').toLowerCase()}-task-report`;

    if (format === 'xls') {
      const tableRows = rows
        .map(
          row =>
            `<tr><td>${escapeSpreadsheetCell(row.bucket)}</td><td>${escapeSpreadsheetCell(
              row.title,
            )}</td><td>${escapeSpreadsheetCell(row.status)}</td><td>${escapeSpreadsheetCell(
              row.due,
            )}</td><td>${escapeSpreadsheetCell(row.assignedBy)}</td></tr>`,
        )
        .join('');
      const html = `<html><body><h2>${escapeSpreadsheetCell(
        selectedUser.name,
      )}</h2><p>${escapeSpreadsheetCell(selectedUser.email)} | ${escapeSpreadsheetCell(
        selectedUser.role,
      )}</p><table border="1"><tr><th>Bucket</th><th>Task</th><th>Status</th><th>Due</th><th>Assigned By</th></tr>${tableRows}</table></body></html>`;

      await openReportFile(`${filenameBase}.xls`, 'application/vnd.ms-excel', html);
      return;
    }

    const pdfLines = [
      `${selectedUser.name} task summary`,
      `Email: ${selectedUser.email}`,
      `Role: ${selectedUser.role}`,
      `Total tasks: ${userTasks.length}`,
      '',
      ...rows.map(row => `${row.bucket}: ${row.title} ${row.status ? `(${row.status})` : ''}`),
    ];

    await openReportFile(
      `${filenameBase}.pdf`,
      'application/pdf',
      encodeBase64(createSimplePdf(pdfLines)),
      true,
    );
  };

  if (!selectedUser) {
    return (
      <SafeAreaView style={styles.page}>
        <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="User Details" onBack={goBack} />
          <EmptyState title="User not found" subtitle="Choose a team member from task assignment." />
        </ScrollView>
        <BottomNav activeTab="profile" renderItem={renderDashboardNavItem} />
      </SafeAreaView>
    );
  }

  const overviewCards: Array<{
    key: UserTaskTab;
    label: string;
    value: number;
  }> = [
    {
      key: 'active',
      label: TASK_TAB_LABELS.active,
      value: taskCounts.active,
    },
    {
      key: 'pending',
      label: TASK_TAB_LABELS.pending,
      value: taskCounts.pending,
    },
    {
      key: 'review',
      label: TASK_TAB_LABELS.review,
      value: taskCounts.review,
    },
    {
      key: 'completed',
      label: TASK_TAB_LABELS.completed,
      value: taskCounts.completed,
    },
  ];

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={styles.formScroll}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader title="User Details" onBack={goBack} />

        <SectionCard title={selectedUser.name}>
          <InfoRow label="Email" value={selectedUser.email} />
          <InfoRow label="Role" value={selectedUser.role} />
          {/* <InfoRow label="Total Tasks" value={String(userTasks.length)} /> */}
          <View style={styles.userDetailsDownloadRow}>
            <Pressable
              onPress={() => downloadUserReport('xls')}
              style={styles.userDetailsDownloadButton}>
              <Text style={styles.userDetailsDownloadText}>Download XL</Text>
            </Pressable>
            <Pressable
              onPress={() => downloadUserReport('pdf')}
              style={styles.userDetailsDownloadButton}>
              <Text style={styles.userDetailsDownloadText}>Download PDF</Text>
            </Pressable>
          </View>
        </SectionCard>

        <ScrollView
          horizontal
          style={styles.myTasksTabScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.myTasksTabScrollContent}>
          <View style={styles.myTasksTabRow}>
          {overviewCards.map(card => (
            <Pressable
              key={card.key}
              onPress={() => handleTaskTabPress(card.key)}
              style={[
                styles.myTasksTabButton,
                activeTaskTab === card.key && styles.myTasksTabButtonActive,
              ]}>
              {activeTaskTab === card.key ? (
                <GradientSurface style={styles.myTasksTabGradient} />
              ) : null}
              <Text
                style={[
                  styles.myTasksTabText,
                  activeTaskTab === card.key && styles.myTasksTabTextActive,
                ]}>
                {card.label}({card.value})
              </Text>
            </Pressable>
          ))}
          </View>
        </ScrollView>

        <SectionCard title={`${TASK_TAB_LABELS[activeTaskTab]}s`}>
          <TextInput
            value={taskSearchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search tasks"
            placeholderTextColor="#94A3B8"
            style={styles.taskListSearchInput}
            autoCapitalize="none"
          />
          {filteredTasks.length ? (
            <View style={styles.userDetailsTaskList}>
              {paginatedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  compact
                  readOnly
                  disableOpen
                  getUserName={getUserName}
                  onOpen={() => {}}
                  onAccept={() => {}}
                  onReject={() => {}}
                  onStart={() => {}}
                  onTogglePause={() => {}}
                  onReview={() => {}}
                  onViewCompleted={() => {}}
                />
              ))}
              {filteredTasks.length > TASKS_PER_PAGE ? (
                <View style={styles.paginationRow}>
                  <Pressable
                    onPress={() => setTaskPage(prev => Math.max(1, prev - 1))}
                    disabled={currentTaskPage === 1}
                    style={[
                      styles.paginationButton,
                      currentTaskPage === 1 && styles.paginationButtonDisabled,
                    ]}>
                    <Text style={styles.paginationButtonText}>Previous</Text>
                  </Pressable>
                  <Text style={styles.paginationText}>
                    Page {currentTaskPage} of {totalTaskPages}
                  </Text>
                  <Pressable
                    onPress={() => setTaskPage(prev => Math.min(totalTaskPages, prev + 1))}
                    disabled={currentTaskPage === totalTaskPages}
                    style={[
                      styles.paginationButton,
                      currentTaskPage === totalTaskPages && styles.paginationButtonDisabled,
                    ]}>
                    <Text style={styles.paginationButtonText}>Next</Text>
                  </Pressable>
                </View>
              ) : null}
              <Text style={styles.taskListMetaText}>
                Showing {paginatedTasks.length} of {filteredTasks.length} tasks
              </Text>
            </View>
          ) : (
            <EmptyState
              title={
                taskSearchQuery.trim()
                  ? 'No matching tasks'
                  : `No ${TASK_TAB_LABELS[activeTaskTab].toLowerCase()}s`
              }
              subtitle={
                taskSearchQuery.trim()
                  ? 'Try a different search term.'
                  : 'This team member does not have tasks in this section right now.'
              }
            />
          )}
        </SectionCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav activeTab="profile" renderItem={renderDashboardNavItem} />
    </SafeAreaView>
  );
}
