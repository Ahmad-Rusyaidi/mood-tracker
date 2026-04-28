import { DEFAULT_TAGS } from "@/constants/tags";
import { styles } from "@/styles/settings.styles";
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Section } from "./SettingsPrimitives";

export function TagManagementSection({
  customTags,
  tagDraft,
  onChangeTagDraft,
  onAddTag,
  onRemoveTag,
}: {
  customTags: string[];
  tagDraft: string;
  onChangeTagDraft: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}) {
  return (
    <Section
      title="Tag management"
      subtitle="Default tags are always available. Custom tags are saved and can be reused on any day."
    >
      <View style={styles.card}>
        <View style={styles.tagGroup}>
          <Text style={styles.groupTitle}>Default tags</Text>
          <View style={styles.tagWrap}>
            {DEFAULT_TAGS.map((tag) => (
              <View key={tag} style={styles.defaultTag}>
                <Text style={styles.defaultTagText}>{`#${tag}`}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tagGroup}>
          <Text style={styles.groupTitle}>Saved custom tags</Text>

          <View style={styles.composerRow}>
            <TextInput
              value={tagDraft}
              onChangeText={onChangeTagDraft}
              placeholder="Create a custom tag"
              placeholderTextColor="rgba(17,24,39,0.35)"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={onAddTag}
            />
            <Pressable onPress={onAddTag} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Add</Text>
            </Pressable>
          </View>

          <View style={styles.tagWrap}>
            {customTags.length > 0 ? (
              customTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => onRemoveTag(tag)}
                  style={styles.removableTag}
                >
                  <Text style={styles.removableTagText}>{`#${tag}`}</Text>
                  <Text style={styles.removableTagX}>Remove</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyHint}>
                No custom tags yet. Add a few here and they will appear in the daily mood screen.
              </Text>
            )}
          </View>
        </View>
      </View>
    </Section>
  );
}
