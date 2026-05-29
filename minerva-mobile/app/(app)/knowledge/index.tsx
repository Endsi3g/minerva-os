import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/Header';
import { StatusPill } from '@/components/StatusPill';
import { EmptyState } from '@/components/EmptyState';
import { BottomSheet } from '@/components/BottomSheet';
import { useMobileLang } from '@/lib/i18n';
import { trackScreen } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

type Article = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
};

export default function KnowledgeIndex() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { trackScreen('Knowledge'); }, []);

  const loadData = useCallback(async () => {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) return;
    const { data } = await supabase.from('knowledge_base').select('*').eq('workspace_id', wid).order('title');
    const articles = (data ?? []).map((a: any) => ({
      ...a,
      tags: Array.isArray(a.tags) ? a.tags : [],
    }));
    setAllArticles(articles);
    setFilteredArticles(articles);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArticles(allArticles);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredArticles(
      allArticles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some(tag => tag.toLowerCase().includes(q)),
      ),
    );
  }, [allArticles, searchQuery]);

  function handleSearch(text: string) {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = text.toLowerCase().trim();
      if (!q) { setFilteredArticles(allArticles); return; }
      setFilteredArticles(allArticles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some(tag => tag.toLowerCase().includes(q)),
      ));
    }, 200);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  type GroupedRow =
    | { type: 'header'; category: string }
    | { type: 'article'; article: Article };

  const categoryOrder: string[] = [];
  const categoryMap = new Map<string, Article[]>();
  for (const article of filteredArticles) {
    if (!categoryMap.has(article.category)) {
      categoryMap.set(article.category, []);
      categoryOrder.push(article.category);
    }
    categoryMap.get(article.category)!.push(article);
  }

  const rows: GroupedRow[] = [];
  for (const cat of categoryOrder) {
    rows.push({ type: 'header', category: cat });
    for (const article of categoryMap.get(cat) ?? []) {
      rows.push({ type: 'article', article });
    }
  }

  const isEmpty = filteredArticles.length === 0;
  const emptyTitle = searchQuery.trim() ? t.knowledge.noResults : t.knowledge.noArticles;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14' }}>
      <Header title={t.knowledge.title} />

      <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
        <TextInput
          style={{ backgroundColor: '#111522', borderRadius: 12, padding: 12, color: '#F5F1E8', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
          placeholder={t.knowledge.searchPlaceholder}
          placeholderTextColor="#8A9099"
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.type === 'header' ? `cat-${row.category}` : `art-${row.article.id}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
        ListEmptyComponent={isEmpty ? <EmptyState emoji="📚" title={emptyTitle} /> : null}
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            return (
              <Text style={{ color: '#8A9099', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8 }}>
                {row.category}
              </Text>
            );
          }

          const { article } = row;
          const preview = article.content.length > 60 ? article.content.slice(0, 60) + '...' : article.content;

          return (
            <TouchableOpacity
              onPress={() => setSelectedArticle(article)}
              style={{ backgroundColor: '#111522', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#F5F1E8', fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 }} numberOfLines={1}>{article.title}</Text>
                <StatusPill status={article.category} label={article.category} />
              </View>
              <Text style={{ color: '#8A9099', fontSize: 12, lineHeight: 17 }}>{preview}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <BottomSheet visible={selectedArticle !== null} onClose={() => setSelectedArticle(null)} title={selectedArticle?.title}>
        {selectedArticle && (
          <View>
            <View style={{ marginBottom: 12 }}>
              <StatusPill status={selectedArticle.category} label={selectedArticle.category} />
            </View>
            <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled>
              <Text style={{ color: '#B8BDC7', fontSize: 14, lineHeight: 22 }}>{selectedArticle.content}</Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setSelectedArticle(null)}
              style={{ marginTop: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <Text style={{ color: '#B8BDC7', fontSize: 14, fontWeight: '600' }}>{t.knowledge.closeArticle}</Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}
