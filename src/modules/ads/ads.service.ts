import { supabase } from '../../config/supabase';
import { AdminAuthError } from '../adminAuth/admin-auth.service';
import type { CreateAdPayload, UpdateAdPayload, SlidePayload } from './ads.schema';

export interface AdRecord {
  id: string;
  title: string;
  kind: 'single' | 'carousel';
  media_type: 'image' | 'video' | null;
  media_url: string | null;
  click_url: string | null;
  caption: string | null;
  slides: SlidePayload[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const SELECT_COLS =
  'id, title, kind, media_type, media_url, click_url, caption, slides, is_active, display_order, created_at, updated_at';

export async function listAds(opts: { activeOnly?: boolean } = {}): Promise<AdRecord[]> {
  let q = supabase
    .from('ads')
    .select(SELECT_COLS)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (opts.activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdRecord[];
}

export async function getAd(id: string): Promise<AdRecord> {
  const { data, error } = await supabase.from('ads').select(SELECT_COLS).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthError('Ad not found', 404);
  return data as AdRecord;
}

export async function createAd(payload: CreateAdPayload): Promise<AdRecord> {
  const row: Record<string, unknown> = {
    title: payload.title,
    kind: payload.kind,
    caption: payload.caption || null,
    click_url: payload.clickUrl || null,
    is_active: payload.isActive ?? true,
    display_order: payload.displayOrder ?? 0,
  };

  if (payload.kind === 'single') {
    row.media_type = payload.mediaType;
    row.media_url = payload.mediaUrl;
    row.slides = [];
  } else {
    row.media_type = null;
    row.media_url = null;
    row.slides = payload.slides;
  }

  const { data, error } = await supabase.from('ads').insert(row).select(SELECT_COLS).maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthError('Ad create failed', 500);
  return data as AdRecord;
}

export async function updateAd(id: string, payload: UpdateAdPayload): Promise<AdRecord> {
  const existing = await getAd(id);

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.title !== undefined) patch.title = payload.title;
  if (payload.caption !== undefined) patch.caption = payload.caption || null;
  if (payload.clickUrl !== undefined) patch.click_url = payload.clickUrl || null;
  if (payload.isActive !== undefined) patch.is_active = payload.isActive;
  if (payload.displayOrder !== undefined) patch.display_order = payload.displayOrder;

  if (existing.kind === 'single') {
    if (payload.mediaType !== undefined) patch.media_type = payload.mediaType;
    if (payload.mediaUrl !== undefined) patch.media_url = payload.mediaUrl;
    if (payload.slides !== undefined) {
      throw new AdminAuthError('Cannot set slides on a single ad', 400);
    }
  } else {
    if (payload.slides !== undefined) patch.slides = payload.slides;
    if (payload.mediaType !== undefined || payload.mediaUrl !== undefined) {
      throw new AdminAuthError('Cannot set mediaType/mediaUrl on a carousel ad', 400);
    }
  }

  const { data, error } = await supabase
    .from('ads')
    .update(patch)
    .eq('id', id)
    .select(SELECT_COLS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthError('Ad not found', 404);
  return data as AdRecord;
}

export async function deleteAd(id: string): Promise<void> {
  const { error } = await supabase.from('ads').delete().eq('id', id);
  if (error) throw error;
}
