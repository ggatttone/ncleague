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
}

export interface UpdateArticleData extends UpsertArticleData {
  id: string;
}

// Hook per recuperare tutti gli articoli (per l'admin)
export function useArticles() {
  return useSupabaseQuery<ArticleWithAuthor[]>(
    ['articles'],
    () => supabase
      .from('articles')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
  );
}

// Hook per recuperare gli articoli pubblicati (per il pubblico)
export function usePublishedArticles() {
  return useSupabaseQuery<ArticleWithAuthor[]>(
    ['published-articles'],
    () => supabase
      .from('articles')
      .select('*, profiles(first_name, last_name)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
  );
}

// Hook per recuperare un singolo articolo tramite ID (per l'admin)
export function useArticle(id: string | undefined) {
  return useSupabaseQuery<Article>(
    ['article', id],
    () => supabase.from('articles').select('*').eq('id', id).single(),
    { enabled: !!id }
  );
}

// Hook per recuperare un singolo articolo pubblicato tramite slug (per il pubblico)
export function usePublishedArticleBySlug(slug: string | undefined) {
  return useSupabaseQuery<ArticleWithAuthor>(
    ['article', slug],
    () => supabase
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
    (data: UpsertArticleData) => 
      supabase.from('articles').insert([data]).select().single()
  );
}

// Hook per aggiornare un articolo esistente
export function useUpdateArticle() {
  return useSupabaseMutation<Article>(
    ['articles'],
    ({ id, ...data }: UpdateArticleData) => 
      supabase.from('articles').update(data).eq('id', id).select().single()
  );
}

// Hook per eliminare un articolo
export function useDeleteArticle() {
  return useSupabaseMutation<void>(
    ['articles'],
    (id: string) => 
      supabase.from('articles').delete().eq('id', id)
  );
}