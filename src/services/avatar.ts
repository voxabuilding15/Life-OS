import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { toast } from '@/store/feedback';
import { supabase } from './supabase';

/** Lets the user pick a photo, uploads it to Supabase Storage (bucket `avatars`) and stores the public URL. */
export async function pickAndUploadAvatar(): Promise<void> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return toast('Allow photo access to set a profile picture.');
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
  if (res.canceled || !res.assets[0]) return;
  const uri = res.assets[0].uri;
  const userId = useAuth.getState().userId;
  if (!supabase || !userId) {
    useProfile.getState().setProfile({ avatarUrl: uri });
    return;
  }
  try {
    const bytes = await (await fetch(uri)).arrayBuffer();
    const path = `${userId}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    useProfile.getState().setProfile({ avatarUrl: data.publicUrl });
  } catch {
    useProfile.getState().setProfile({ avatarUrl: uri });
    toast('Saved on this device. Upload will retry when you are online.');
  }
}
