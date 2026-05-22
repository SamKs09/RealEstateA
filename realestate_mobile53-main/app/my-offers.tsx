import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import apiService from '../services/api';
import { BackButton } from '../components/Ui/BackButton';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '../components/styles/GlobalStyles';

interface Offer {
  id: string;
  buyer: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

interface OfferGroup {
  id: string;
  type: 'property' | 'car';
  item: {
    id: string;
    image: string;
    name: string;
    price: string;
    details: {
      bedrooms?: number;
      bathrooms?: number;
      year?: number;
      mileage?: number;
    };
  };
  offers: Offer[];
}

const MyOffersScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<OfferGroup[]>([]);

  useEffect(() => {
    loadOffers();
  }, [user]);

  const loadOffers = async () => {
    if (!user || !user._id) return;
    setLoading(true);
    try {
      const type = user.interest === 'cars' ? 'car' : 'property';
      const res = await apiService.get<any>(`/seller/offers?type=${type}`);
      if (res.success) {
        setOffers(res.offers || []);
      }
    } catch (err: any) {
      console.error('Error loading offers:', err);
      Alert.alert(t('offers.error'), err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId: string) => {
    try {
      const res = await apiService.put<any>(`/seller/offers/${offerId}/accept`);
      if (res.success) {
        // Update local state
        setOffers(prev => prev.map(group => ({
          ...group,
          offers: group.offers.map(o => o.id === offerId ? { ...o, status: 'accepted' } : o)
        })));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept offer');
    }
  };

  const handleDecline = async (offerId: string) => {
    try {
      const res = await apiService.put<any>(`/seller/offers/${offerId}/decline`);
      if (res.success) {
        // Update local state
        setOffers(prev => prev.map(group => ({
          ...group,
          offers: group.offers.map(o => o.id === offerId ? { ...o, status: 'declined' } : o)
        })));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to decline offer');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} color={Colors.textPrimary} />
        <Text style={styles.headerTitle}>{t('offers.title')}</Text>
        <TouchableOpacity>
          <Text style={styles.filterText}>{t('offers.filter')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('offers.noOffers')}</Text>
          </View>
        ) : (
          offers.map((group) => (
            <View key={group.id} style={styles.offerGroup}>
              <ItemSummary item={group.item} offersCount={group.offers.filter(o => o.status === 'pending').length} t={t} />
              {group.offers.map((offer) => (
                <OfferCard 
                  key={offer.id} 
                  offer={offer} 
                  onAccept={() => handleAccept(offer.id)}
                  onDecline={() => handleDecline(offer.id)}
                  t={t}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const ItemSummary = ({ item, offersCount, t }: { item: any; offersCount: number; t: any }) => (
  <View style={styles.summaryContainer}>
    <Image source={{ uri: item.image }} style={styles.itemImage} contentFit="cover" />
    <View style={styles.itemInfo}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        {offersCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {t('offers.pendingOffers', { count: offersCount })}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.itemPrice}>{item.price}</Text>
      <View style={styles.detailsRow}>
        {item.details.bedrooms !== undefined && (
          <View style={styles.detailItem}>
            <Ionicons name="bed-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {item.details.bedrooms} {item.details.bedrooms === 1 ? t('property.bedroom') : t('property.bedrooms')}
            </Text>
          </View>
        )}
        {item.details.bathrooms !== undefined && (
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              {item.details.bathrooms} {item.details.bathrooms === 1 ? t('property.bathroom') : t('property.bathrooms')}
            </Text>
          </View>
        )}
        {item.details.year !== undefined && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.details.year}</Text>
          </View>
        )}
        {item.details.mileage !== undefined && (
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.details.mileage} km</Text>
          </View>
        )}
      </View>
    </View>
  </View>
);

const OfferCard = ({ offer, onAccept, onDecline, t }: { offer: Offer; onAccept: () => void; onDecline: () => void; t: any }) => {
  if (offer.status === 'declined') return null;

  return (
    <View style={styles.card}>
      <View style={styles.buyerRow}>
        <Image source={{ uri: offer.buyer.avatar }} style={styles.avatar} contentFit="cover" />
        <View style={styles.buyerInfo}>
          <Text style={styles.buyerName}>{offer.buyer.fullName || `${offer.buyer.firstName} ${offer.buyer.lastName}`}</Text>
          {offer.status === 'accepted' ? (
            <Text style={styles.acceptedText}>{t('offers.accepted')} ✓</Text>
          ) : (
            <Text style={styles.messageText}>{offer.message || t('offers.readyToNegotiate')}</Text>
          )}
        </View>
      </View>

      {offer.status === 'pending' ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>{t('offers.accept')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineButtonText}>{t('offers.decline')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.acceptedContainer}>
          <Text style={styles.acceptedDescription}>
            {t('offers.acceptedMessage')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  filterText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
  },
  offerGroup: {
    marginBottom: 30,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.backgroundGray,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: '#FFE5D4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
    marginVertical: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 5,
    fontFamily: Typography.fontFamily.regular,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundGray,
  },
  buyerInfo: {
    marginLeft: 15,
    flex: 1,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
  },
  messageText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
  acceptedText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: 'bold',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily.medium,
  },
  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Typography.fontFamily.medium,
  },
  acceptedContainer: {
    marginTop: 5,
  },
  acceptedDescription: {
    fontSize: 14,
    color: '#34C759',
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
});

export default MyOffersScreen;
