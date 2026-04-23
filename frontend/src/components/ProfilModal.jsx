import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import { useTranslation } from "react-i18next";
import { avatarSrcWithBust } from "../utils/avatar";
import { UserRoutes } from "../../../backend/config/resourceNames";

function ProfileModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const fileRef = useRef(null);
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarBust, setAvatarBust] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(UserRoutes.ME);
        setFormData({
          username: res.data.username ?? "",
          first_name: res.data.first_name ?? "",
          last_name: res.data.last_name ?? "",
          email: res.data.email ?? "",
        });
        setAvatarUrl(res.data.profile_picture_url || null);
      } catch {
        setFormData({
          username: user?.username ?? "",
          first_name: "",
          last_name: "",
          email: "",
        });
        setAvatarUrl(user?.profile_picture_url || null);
      }
    };
    fetchProfile();
  }, [user?.username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const { data } = await api.post("/users/me/avatar", fd);
      const path = data.profile_picture_url || null;
      setAvatarUrl(path);
      const bust = Date.now();
      setAvatarBust(bust);
      await refreshProfile({ avatarBust: true });
    } catch (err) {
      setError(err.response?.data?.message ?? t("profileModal.updateError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.patch("/users/me", formData);
      await refreshProfile();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message ?? t("profileModal.updateError"));
    } finally {
      setLoading(false);
    }
  };

  const displaySrc = avatarSrcWithBust(avatarUrl, avatarBust || user?.avatarBust);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t("profileModal.title")}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label={t("profileModal.close")}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="modal-error">{error}</p>}
          <div className="profile-modal-avatar-block">
            <img className="profile-modal-avatar" src={displaySrc} alt="" width={96} height={96} />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={handleAvatar}
              disabled={uploading}
            />
            <button
              type="button"
              className="profile-modal-avatar-btn"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "…" : t("profileModal.changePhoto")}
            </button>
            <p className="profile-modal-avatar-hint">{t("profileModal.photoHint")}</p>
          </div>
          <label>
            {t("profileModal.username")}
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
            />
          </label>
          <label>
            {t("profileModal.firstName")}
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} />
          </label>
          <label>
            {t("profileModal.lastName")}
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} />
          </label>
          <label>
            {t("profileModal.email")}
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              {t("profileModal.cancel")}
            </button>
            <button type="submit" disabled={loading}>
              {loading ? t("profileModal.saving") : t("profileModal.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
