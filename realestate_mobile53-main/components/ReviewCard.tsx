import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Review } from "../services/sellerService";

interface ReviewCardProps {
  review: Review;
  /** ID of the currently logged-in user (undefined if not authenticated) */
  currentUserId?: string;
  /** ID of the seller who owns the profile being viewed */
  sellerId?: string;
  onReply?: (reviewId: string, replyText: string) => Promise<void>;
  onReport?: (reviewId: string, reason: string) => Promise<void>;
  onEdit?: (reviewId: string, rating: number, comment: string) => Promise<void>;
  onDelete?: (reviewId: string) => Promise<void>;
}

const STAR_COLOR = "#FFD700";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={
            s <= value ? "star" : s - 0.5 <= value ? "star-half" : "star-outline"
          }
          size={size}
          color={STAR_COLOR}
        />
      ))}
    </View>
  );
}

export default function ReviewCard({
  review,
  currentUserId,
  sellerId,
  onReply,
  onReport,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const isReviewer = currentUserId && review.reviewer.id === currentUserId;
  const isSeller = currentUserId && sellerId && currentUserId === sellerId;

  // 30-day edit window
  const withinEditWindow =
    isReviewer &&
    new Date().getTime() - new Date(review.createdAt).getTime() <
      30 * 24 * 60 * 60 * 1000;

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !onReply) return;
    setSubmittingReply(true);
    try {
      await onReply(review.id, replyText.trim());
      setShowReplyInput(false);
      setReplyText("");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!onEdit) return;
    setSubmittingEdit(true);
    try {
      await onEdit(review.id, editRating, editComment);
      setEditing(false);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleReport = () => {
    if (!onReport) return;
    Alert.prompt(
      "Report Review",
      "Please describe why you are reporting this review:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: (reason) => {
            if (reason) onReport(review.id, reason);
          },
        },
      ],
      "plain-text"
    );
  };

  const handleDelete = () => {
    if (!onDelete) return;
    Alert.alert("Delete Review", "Are you sure you want to delete this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(review.id),
      },
    ]);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: review.reviewer.avatar || "https://via.placeholder.com/40" }}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.reviewerName}>{review.reviewer.name}</Text>
          <Stars value={review.rating} />
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.date}>{review.relativeDate}</Text>
          {review.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* Comment / Edit form */}
      {editing ? (
        <View style={styles.editBlock}>
          {/* Star selector */}
          <View style={styles.editStars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setEditRating(s)}>
                <Ionicons
                  name={s <= editRating ? "star" : "star-outline"}
                  size={28}
                  color={STAR_COLOR}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.editInput}
            value={editComment}
            onChangeText={setEditComment}
            multiline
            maxLength={500}
            placeholder="Edit your review…"
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmitEdit}
              style={[styles.submitBtn, submittingEdit && styles.disabled]}
              disabled={submittingEdit}
            >
              <Text style={styles.submitBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.comment}>{review.comment}</Text>
      )}

      {/* Reviewed item thumbnail */}
      {review.item && !editing && (
        <View style={styles.itemRow}>
          {review.item.image && (
            <Image
              source={{ uri: review.item.image }}
              style={styles.itemImage}
              contentFit="cover"
            />
          )}
          <Text style={styles.itemTitle} numberOfLines={1}>
            {review.item.title}
          </Text>
        </View>
      )}

      {/* Seller reply */}
      {review.reply && (
        <View style={styles.replyBlock}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#555" />
          <View style={styles.replyContent}>
            <Text style={styles.replyLabel}>Seller's reply</Text>
            <Text style={styles.replyText}>{review.reply.text}</Text>
          </View>
        </View>
      )}

      {/* Reply input (seller only, no existing reply) */}
      {isSeller && !review.reply && onReply && (
        <>
          {showReplyInput ? (
            <View style={styles.replyInputBlock}>
              <TextInput
                style={styles.replyInput}
                placeholder="Write a reply…"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={500}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={() => { setShowReplyInput(false); setReplyText(""); }}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmitReply}
                  style={[styles.submitBtn, submittingReply && styles.disabled]}
                  disabled={submittingReply}
                >
                  <Text style={styles.submitBtnText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.replyToggle}
              onPress={() => setShowReplyInput(true)}
            >
              <Ionicons name="return-down-forward-outline" size={15} color="#007AFF" />
              <Text style={styles.replyToggleText}>Reply to review</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Action row */}
      <View style={styles.actionRow}>
        {withinEditWindow && onEdit && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => setEditing(true)}>
            <Ionicons name="pencil-outline" size={15} color="#555" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}
        {isReviewer && onDelete && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={15} color="#E53935" />
            <Text style={[styles.actionText, { color: "#E53935" }]}>Delete</Text>
          </TouchableOpacity>
        )}
        {!isReviewer && !isSeller && onReport && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleReport}>
            <Ionicons name="flag-outline" size={15} color="#888" />
            <Text style={[styles.actionText, { color: "#888" }]}>Report</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  comment: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 6,
    marginBottom: 8,
    gap: 8,
  },
  itemImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  itemTitle: {
    flex: 1,
    fontSize: 12,
    color: "#555",
  },
  replyBlock: {
    flexDirection: "row",
    backgroundColor: "#f0f4ff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  replyToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  replyToggleText: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  replyInputBlock: {
    marginBottom: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  editBlock: {
    marginBottom: 8,
  },
  editStars: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelBtnText: {
    fontSize: 13,
    color: "#555",
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  submitBtnText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  actionRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: "#555",
  },
});
