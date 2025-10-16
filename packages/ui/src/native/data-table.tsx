import * as React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type FlatListProps,
  type ListRenderItem,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from 'react-native';

export interface NativeDataTableProps<ItemT> extends Omit<FlatListProps<ItemT>, 'renderItem'> {
  renderRow: ListRenderItem<ItemT>;
  emptyMessage?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  rowStyle?: StyleProp<ViewStyle>;
  cellTextStyle?: StyleProp<TextStyle>;
}

export function NativeDataTable<ItemT>({
  data,
  renderRow,
  keyExtractor,
  emptyMessage = 'No data available.',
  style,
  contentContainerStyle,
  rowStyle,
  cellTextStyle,
  ...props
}: NativeDataTableProps<ItemT>) {
  const renderItem = React.useCallback<ListRenderItem<ItemT>>(
    (itemInfo) => {
      const rendered = renderRow(itemInfo);
      if (rendered) {
        return (
          <View style={[styles.row, rowStyle]}>
            {React.isValidElement(rendered) ? rendered : <Text style={[styles.cellText, cellTextStyle]}>{rendered}</Text>}
          </View>
        );
      }

      return null;
    },
    [cellTextStyle, renderRow, rowStyle]
  );

  const resolvedKeyExtractor = React.useCallback(
    (item: ItemT, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }

      return index.toString();
    },
    [keyExtractor]
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={resolvedKeyExtractor}
      style={[styles.table, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      ListEmptyComponent={() => (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      )}
      {...props}
    />
  );
}

export interface NativeDataTableHeaderProps {
  title?: string;
  description?: string;
}

export const NativeDataTableHeader: React.FC<NativeDataTableHeaderProps> = ({ title, description }) => (
  <View style={styles.header}>
    {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
    {description ? <Text style={styles.headerDescription}>{description}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  table: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.75)'
  },
  content: {
    paddingVertical: 4
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)'
  },
  cellText: {
    color: '#e2e8f0',
    fontSize: 14
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 14
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9'
  },
  headerDescription: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.9)'
  }
});
