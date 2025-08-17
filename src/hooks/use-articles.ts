import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { supabase } from '@/lib/supabase/client';
import { Article } from '@/types/database';

// Interfaccia per i dati di un articolo con l'autore
export type ArticleWithAuthor = Article & {
  profiles: { first_name: string | null; last_name: string | null } | null;
};

// Dati per creare/aggiornare un articolo
export interface UpsertArticleData {
  title: string;
  slug: string;
  content?: string;
  cover_image_url?: string;
  author_id: string;
  status: 'draft' | 'published';
  published_at?: string | null;
  is_pinned?: boolean;
}

export interface UpdateArticleData extends UpsertArticleData {
  id: string;
}

// Hook per recuperare tutti gli articoli (per l'admin)
export function useArticles() {
  return useSupabaseQuery<ArticleWithAuthor[]>(
    ['articles'],
    async () => supabase
      .from('articles')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
  );
}

// Hook per recuperare gli articoli pubblicati (per il pubblico), con i fissati in cima
export function usePublishedArticles() {
  return useSupabaseQuery<ArticleWithAuthor[]>(
    ['published-articles'],
    async () => supabase
      .from('articles')
      .select('*, profiles(first_name, last_name)')
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
  );
}

// Hook per recuperare solo gli ultimi articoli (per il widget)
export function useLatestArticles() {
  return useSupabaseQuery<ArticleWithAuthor[]>(
    ['latest-articles'],
    async () => supabase
      .from('articles')
      .select('*, profiles(first_name, last_name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
  );
}

// Hook per recuperare solo gli articoli fissati (per il widget in evidenza)
export function usePinnedArticles() {
  return useSupabaseQuery<ArticleWithAuthor[]>(
    ['pinned-articles'],
    async () => supabase
      .from('articles')
      .select('*, profiles(first_name, last_name)')
      .eq('status', 'published')
      .eq('is_pinned', true)
      .order('published_at', { ascending: false })
  );
}

// Hook per recuperare un singolo articolo tramite ID (per l'admin e widget)
export function useArticle(id: string | undefined) {
  return useSupabaseQuery<ArticleWithAuthor>(
    ['article', id],
    async () => supabase
      .from('articles')
      .select('*, profiles(first_name, last_name)')
      .eq('id', id)
      .single(),
    { enabled: !!id }
  );
}

// Hook per recuperare un singolo articolo pubblicato tramite slug (per il pubblico)
export function usePublishedArticleBySlug(slug: string | undefined) {
  return useSupabaseQuery<ArticleWithAuthor>(
    ['article', slug],
    async () => supabase
      .from('articles')
      .select('*, profiles(first_name, last_name)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single(),
    { enabled: !!slug }
  );
}

// Hook per creare un nuovo articolo
export function useCreateArticle() {
  return useSupabaseMutation<Article>(
    ['articles'],
    async (data: UpsertArticleData) => 
      supabase.from('articles').insert([data]).select().single()
  );
}

// Hook per aggiornare un articolo esistente
export function useUpdateArticle() {
  return useSupabaseMutation<Article>(
    ['articles'],
    async ({ id, ...data }: UpdateArticleData) => 
      supabase.from('articles').update(data).eq('id', id).select().single()
  );
}

// Hook per fissare/sbloccare un articolo
export function useTogglePinArticle() {
  return useSupabaseMutation<Article, { id: string; is_pinned: boolean }>(
    ['articles'],
    async ({ id, is_pinned }) =>
      supabase.from('articles').update({ is_pinned }).eq('id', id).select().single()
  );
}

// Hook per eliminare un articolo
export function useDeleteArticle() {
  return useSupabaseMutation<void>(
    ['articles'],
    async (id: string) => 
      supabase.from('articles').delete().eq('id', id)
  );
}