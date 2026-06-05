import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionButton,
  BottomNav,
  EmptyState,
  FieldLabel,
  FormCard,
  GradientSurface,
  ScreenHeader,
} from '../../components';
import { COLORS, User } from '../../domain/model';
import { styles } from '../../theme/styles';
import type {
  CreateUserInput,
  ScreenRendererProps,
  UpdateUserInput,
} from '../types';

type UserTab = 'add' | 'list' | 'assignments';

type ManageUsersScreenProps = Pick<
  ScreenRendererProps,
  | 'users'
  | 'tasks'
  | 'currentUser'
  | 'goBack'
  | 'handleCreateUser'
  | 'handleUpdateUser'
  | 'handleDeleteUser'
  | 'renderDashboardNavItem'
  | 'isUsersLoading'
  | 'userActionError'
  | 'isSavingUser'
  | 'openUserDetails'
>;

const INITIAL_FORM = {
  name: '',
  email: '',
  telephone: '',
  role: '',
  password: '',
};

const ROLE_OPTIONS = ['Admin', 'Employee'] as const;

type FormErrors = {
  name?: string;
  email?: string;
  telephone?: string;
  role?: string;
  password?: string;
};

function getUserTaskIdentityKeys(selectedUser: User, users: User[]) {
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

export function ManageUsersScreen(props: ManageUsersScreenProps) {
  const {
    users,
    tasks,
    currentUser,
    goBack,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    renderDashboardNavItem,
    isUsersLoading,
    userActionError,
    isSavingUser,
    openUserDetails,
  } = props;
  const [activeTab, setActiveTab] = useState<UserTab>('add');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showRolePicker, setShowRolePicker] = useState(false);

  const uniqueUsers = useMemo(() => {
    const seen = new Set<string>();

    return users.filter(user => {
      const identityKeys = [user.id, user.backendId, user.email.toLowerCase()].filter(
        (value): value is string => Boolean(value?.trim()),
      );

      if (identityKeys.some(identityKey => seen.has(identityKey))) {
        return false;
      }

      identityKeys.forEach(identityKey => seen.add(identityKey));
      return true;
    });
  }, [users]);

  const assignmentSummary = useMemo(() => {
    return uniqueUsers.map(user => {
      const userKeys = getUserTaskIdentityKeys(user, users);
      const userTasks = tasks.filter(task => userKeys.has(task.assignedTo));
      const grouped = {
        active: userTasks.filter(task => task.status === 'in_progress'),
        pending: userTasks.filter(task => task.status === 'pending'),
        review: userTasks.filter(
          task => task.status === 'under_review' || task.status === 'rejected',
        ),
        completed: userTasks.filter(task => task.status === 'completed'),
      };

      return {
        user,
        pending: grouped.pending.length,
        active: grouped.active.length,
        review: grouped.review.length,
        done: grouped.completed.length,
        tasks: userTasks,
      };
    });
  }, [tasks, uniqueUsers, users]);

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm(INITIAL_FORM);
    setFormErrors({});
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const trimmedName = userForm.name.trim();
    const trimmedEmail = userForm.email.trim();
    const trimmedRole = userForm.role.trim();
    const trimmedPhone = userForm.telephone.trim();

    if (!trimmedName) {
      nextErrors.name = 'Full name is required.';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!trimmedPhone) {
      nextErrors.telephone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(trimmedPhone)) {
      nextErrors.telephone = 'Enter a valid 10-digit phone number.';
    }

    if (!trimmedRole) {
      nextErrors.role = 'Please select a role.';
    }

    if (!editingUserId && !userForm.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const basePayload: UpdateUserInput = {
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      telephone: userForm.telephone.trim(),
      role: userForm.role.trim(),
    };

    if (editingUserId) {
      const didUpdate = await handleUpdateUser(editingUserId, basePayload);

      if (didUpdate) {
        resetUserForm();
      }
    } else {
      if (!userForm.password.trim()) {
        return;
      }

      const createPayload: CreateUserInput = {
        ...basePayload,
        password: userForm.password.trim(),
      };

      const didCreate = await handleCreateUser(createPayload);

      if (didCreate) {
        resetUserForm();
      }
    }
  };

  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      email: user.email,
      telephone: user.telephone ?? '',
      role: user.role,
      password: '',
    });
    setFormErrors({});
    setActiveTab('add');
  };

  const handleRoleSelect = (role: (typeof ROLE_OPTIONS)[number]) => {
    setUserForm(prev => ({ ...prev, role }));
    setFormErrors(prev => ({ ...prev, role: undefined }));
    setShowRolePicker(false);
  };

  const userTabs: Array<{ key: UserTab; label: string }> = [
    { key: 'add', label: editingUserId ? 'Edit User' : 'Add User' },
    { key: 'list', label: 'User List' },
    { key: 'assignments', label: 'Task Assign' },
  ];

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        style={styles.flexOne}
        contentContainerStyle={styles.formScroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Manage Users" onBack={goBack} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.myTasksTabScrollContent}
        >
          <View style={styles.myTasksTabRow}>
            {userTabs.map(tab => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.myTasksTabButton,
                  activeTab === tab.key && styles.myTasksTabButtonActive,
                ]}
              >
                {activeTab === tab.key ? (
                  <GradientSurface style={styles.myTasksTabGradient} />
                ) : null}
                <Text
                  style={[
                    styles.myTasksTabText,
                    activeTab === tab.key && styles.myTasksTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {activeTab === 'add' ? (
          <>
            <FormCard>
              <FieldLabel label="Full Name" />
              <TextInput
                value={userForm.name}
                onChangeText={value => {
                  setUserForm(prev => ({ ...prev, name: value }));
                  setFormErrors(prev => ({ ...prev, name: undefined }));
                }}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textSoft}
                style={styles.inputNoMargin}
              />
              {formErrors.name ? (
                <Text style={styles.inlineFieldError}>{formErrors.name}</Text>
              ) : null}
            </FormCard>

            <FormCard>
              <FieldLabel label="Email" />
              <TextInput
                value={userForm.email}
                onChangeText={value => {
                  setUserForm(prev => ({ ...prev, email: value }));
                  setFormErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="Enter email address"
                placeholderTextColor={COLORS.textSoft}
                style={styles.inputNoMargin}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {formErrors.email ? (
                <Text style={styles.inlineFieldError}>{formErrors.email}</Text>
              ) : null}
            </FormCard>

            <FormCard>
              <FieldLabel label="Phone Number" />
              <TextInput
                value={userForm.telephone}
                onChangeText={value => {
                  setUserForm(prev => ({ ...prev, telephone: value }));
                  setFormErrors(prev => ({ ...prev, telephone: undefined }));
                }}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.textSoft}
                style={styles.inputNoMargin}
                keyboardType="phone-pad"
              />
              {formErrors.telephone ? (
                <Text style={styles.inlineFieldError}>
                  {formErrors.telephone}
                </Text>
              ) : null}
            </FormCard>

            <FormCard>
              <FieldLabel label="Role" />
              <Pressable
                onPress={() => setShowRolePicker(true)}
                style={styles.selectField}
              >
                <Text
                  style={[
                    styles.selectFieldText,
                    !userForm.role.trim() && styles.userRolePlaceholder,
                  ]}
                >
                  {userForm.role.trim() || 'Select role'}
                </Text>
                <Text style={styles.selectFieldArrow}>⌄</Text>
              </Pressable>
              {formErrors.role ? (
                <Text style={styles.inlineFieldError}>{formErrors.role}</Text>
              ) : null}
            </FormCard>

            {!editingUserId ? (
              <FormCard>
                <FieldLabel label="Create Password" />
                <TextInput
                  value={userForm.password}
                  onChangeText={value => {
                    setUserForm(prev => ({ ...prev, password: value }));
                    setFormErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Create a password"
                  placeholderTextColor={COLORS.textSoft}
                  secureTextEntry
                  style={styles.inputNoMargin}
                />
                {formErrors.password ? (
                  <Text style={styles.inlineFieldError}>
                    {formErrors.password}
                  </Text>
                ) : null}
              </FormCard>
            ) : null}

            <ActionButton
              title={
                isSavingUser
                  ? editingUserId
                    ? 'Saving...'
                    : 'Creating...'
                  : editingUserId
                  ? 'Save User'
                  : 'Add User'
              }
              onPress={handleSubmit}
              variant="primary"
            />
            {editingUserId ? (
              <ActionButton
                title="Cancel Edit"
                onPress={resetUserForm}
                variant="secondary"
              />
            ) : null}
            {userActionError ? (
              <Text style={styles.formErrorText}>{userActionError}</Text>
            ) : null}
          </>
        ) : null}

        {activeTab === 'list' ? (
          isUsersLoading ? (
            <EmptyState
              title="Loading users"
              subtitle="Pulling the latest team directory."
            />
          ) : uniqueUsers.length ? (
            <View style={styles.manageUsersList}>
              {uniqueUsers.map(user => (
                <View key={user.id} style={styles.userRowCard}>
                  <View style={styles.userRowMain}>
                    <View style={styles.userAvatarMini}>
                      <GradientSurface style={styles.userAvatarMiniGradient} />
                      <Text style={styles.userAvatarMiniText}>
                        {user.name
                          .split(' ')
                          .map(part => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.flexOne}>
                      <Text style={styles.userRowName}>{user.name}</Text>
                      <Text style={styles.userRowMeta}>{user.email}</Text>
                      {user.telephone?.trim() ? (
                        <Text style={styles.userRowMeta}>{user.telephone}</Text>
                      ) : null}
                      <Text style={styles.userRowMeta}>{user.role}</Text>
                    </View>
                  </View>
                  <View style={styles.userRowActions}>
                    <Pressable
                      onPress={() => startEditing(user)}
                      style={styles.userActionButton}
                    >
                      <Text style={styles.userActionEdit}>✎</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteUser(user.id)}
                      disabled={currentUser?.id === user.id || isSavingUser}
                      style={styles.userActionButton}
                    >
                      <Text
                        style={[
                          styles.userActionDelete,
                          (currentUser?.id === user.id || isSavingUser) &&
                            styles.userActionDisabled,
                        ]}
                      >
                        ✕
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No users yet"
              subtitle="Add your first teammate here."
            />
          )
        ) : null}

        {activeTab === 'assignments' ? (
          assignmentSummary.length ? (
            <View style={styles.assignmentSummaryList}>
              {assignmentSummary.map(item => (
                <Pressable
                  key={item.user.id}
                  onPress={() => openUserDetails(item.user.id)}
                  style={styles.assignmentCard}
                >
                  <View style={styles.assignmentHeader}>
                    <View>
                      <Text style={styles.assignmentName}>
                        {item.user.name}
                      </Text>
                      <Text style={styles.assignmentRole}>
                        {item.user.role}
                      </Text>
                    </View>
                    <Text style={styles.assignmentTotal}>
                      {item.tasks.length} tasks (View)
                    </Text>
                    
                  </View>

                  <View style={styles.assignmentStatsRow}>
                    <View
                      style={[
                        styles.assignmentStatPill,
                        styles.overviewCardPending,
                      ]}
                    >
                      <Text style={styles.assignmentStatLabel}>Pending</Text>
                      <Text style={styles.assignmentStatValue}>
                        {item.pending}
                      </Text>
                    </View>
                    {/* <View
                      style={[
                        styles.assignmentStatPill,
                        styles.overviewCardActive,
                      ]}
                    >
                      <Text style={styles.assignmentStatLabel}>Active</Text>
                      <Text style={styles.assignmentStatValue}>
                        {item.active}
                      </Text>
                    </View> */}
                    <View
                      style={[
                        styles.assignmentStatPill,
                        styles.overviewCardReview,
                      ]}
                    >
                      <Text style={styles.assignmentStatLabel}>Review</Text>
                      <Text style={styles.assignmentStatValue}>
                        {item.review}
                      </Text>
                    </View>
                     <View
                      style={[
                        styles.assignmentStatPill,
                        styles.overviewCardCompleted,
                      ]}
                    >
                      <Text style={styles.assignmentStatLabel}>Done</Text>
                      <Text style={styles.assignmentStatValue}>
                        {item.done}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.assignmentStatsRow}>
                   
                
                  </View>
                      {/* <View style={styles.assignmentCardFooter}>
                      <Text style={styles.assignmentOpenText}>
                        Tap to view full details
                      </Text>
                      <Text style={styles.assignmentOpenArrow}>›</Text>
                    </View> */}
                </Pressable>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No assignments yet"
              subtitle="Task ownership will appear here once users have work assigned."
            />
          )
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={showRolePicker}
        onRequestClose={() => setShowRolePicker(false)}
      >
        <Pressable
          style={styles.modalOverlayCenter}
          onPress={() => setShowRolePicker(false)}
        >
          <Pressable
            style={styles.userRoleModalCard}
            onPress={event => event.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Select Role</Text>
            <Text style={styles.modalText}>
              Choose the access level for this user.
            </Text>
            <View style={styles.userRoleOptionList}>
              {ROLE_OPTIONS.map(role => {
                const isActive = userForm.role === role;

                return (
                  <Pressable
                    key={role}
                    onPress={() => handleRoleSelect(role)}
                    style={[
                      styles.userRoleOption,
                      isActive && styles.userRoleOptionActive,
                    ]}
                  >
                    {isActive ? (
                      <GradientSurface style={styles.userRoleOptionGradient} />
                    ) : null}
                    <Text
                      style={[
                        styles.userRoleOptionText,
                        isActive && styles.userRoleOptionTextActive,
                      ]}
                    >
                      {role}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNav activeTab="profile" renderItem={renderDashboardNavItem} />
    </SafeAreaView>
  );
}
