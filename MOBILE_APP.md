# Hotel Booking System - Mobile App Structure (React Native)

This document outlines the structure for a React Native mobile app that mirrors the web version.

## 📱 Project Setup

```bash
# Create React Native project
npx react-native init HotelBookingMobile

# Install dependencies
npm install axios react-navigation react-native-screens react-native-gesture-handler
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install redux react-redux
npm install @stripe/stripe-react-native
npm install socket.io-client
```

## 📁 Project Structure

```
HotelBookingMobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   └── SplashScreen.js
│   │   ├── booking/
│   │   │   ├── BookingListScreen.js
│   │   │   ├── BookingDetailScreen.js
│   │   │   ├── CreateBookingScreen.js
│   │   │   └── PaymentScreen.js
│   │   ├── room/
│   │   │   ├── RoomListScreen.js
│   │   │   ├── RoomDetailScreen.js
│   │   │   └── RoomSearchScreen.js
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.js
│   │   │   └── AnalyticsScreen.js
│   │   ├── admin/
│   │   │   ├── AdminPanelScreen.js
│   │   │   ├── BookingManagementScreen.js
│   │   │   └── OfferManagementScreen.js
│   │   └── common/
│   │       ├── ReviewScreen.js
│   │       └── ProfileScreen.js
│   ├── components/
│   │   ├── RoomCard.js
│   │   ├── BookingCard.js
│   │   ├── ReviewComponent.js
│   │   ├── StatsCard.js
│   │   └── LoadingSpinner.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── bookingService.js
│   │   ├── socketService.js
│   │   └── stripeService.js
│   ├── redux/
│   │   ├── store.js
│   │   ├── reducers/
│   │   │   ├── authReducer.js
│   │   │   ├── bookingReducer.js
│   │   │   └── roomReducer.js
│   │   └── actions/
│   │       ├── authActions.js
│   │       ├── bookingActions.js
│   │       └── roomActions.js
│   ├── navigation/
│   │   ├── RootNavigator.js
│   │   ├── AuthNavigator.js
│   │   ├── MainNavigator.js
│   │   └── AdminNavigator.js
│   ├── styles/
│   │   ├── colors.js
│   │   ├── typography.js
│   │   └── spacing.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── validators.js
│   │   └── helpers.js
│   └── App.js
├── android/
├── ios/
├── app.json
├── package.json
└── .env
```

## 🔧 Core Screens

### 1. Authentication Screens

**LoginScreen.js**
```javascript
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { login } from '../redux/actions/authActions';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      await dispatch(login(email, password));
      navigation.replace('Main');
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hotel Booking</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 12, borderRadius: 5 },
  button: { backgroundColor: '#667eea', padding: 12, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#667eea', marginTop: 15, textAlign: 'center' },
});
```

### 2. Room List Screen

**RoomListScreen.js**
```javascript
import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRooms } from '../redux/actions/roomActions';
import RoomCard from '../components/RoomCard';

export default function RoomListScreen({ navigation }) {
  const dispatch = useDispatch();
  const rooms = useSelector(state => state.room.rooms);
  const loading = useSelector(state => state.room.loading);

  useEffect(() => {
    dispatch(fetchRooms());
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <RoomCard 
            room={item}
            onPress={() => navigation.navigate('RoomDetail', { roomId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
});
```

### 3. Booking Creation Screen

**CreateBookingScreen.js**
```javascript
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, DatePickerIOS } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createBooking } from '../redux/actions/bookingActions';

export default function CreateBookingScreen({ navigation, route }) {
  const { roomId } = route.params;
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date());
  const dispatch = useDispatch();
  const loading = useSelector(state => state.booking.loading);

  const handleBooking = async () => {
    try {
      await dispatch(createBooking({
        roomId,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        totalPrice: calculatePrice(),
      }));
      alert('Booking created successfully!');
      navigation.goBack();
    } catch (error) {
      alert('Booking failed: ' + error.message);
    }
  };

  const calculatePrice = () => {
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    return days * 2000; // Mock price
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Check-in Date:</Text>
      <DatePickerIOS value={checkInDate} onDateChange={setCheckInDate} />
      
      <Text style={styles.label}>Check-out Date:</Text>
      <DatePickerIOS value={checkOutDate} onDateChange={setCheckOutDate} />
      
      <Text style={styles.price}>Total: ETB {calculatePrice()}</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleBooking} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Booking...' : 'Confirm Booking'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'white' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#667eea', marginBottom: 20, textAlign: 'center' },
  button: { backgroundColor: '#667eea', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
```

### 4. Dashboard Screen

**DashboardScreen.js**
```javascript
import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBookings } from '../redux/actions/bookingActions';
import StatsCard from '../components/StatsCard';
import BookingCard from '../components/BookingCard';

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const bookings = useSelector(state => state.booking.userBookings);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    dispatch(fetchUserBookings());
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatsCard title="Total Bookings" value={bookings.length} />
        <StatsCard title="Active Offers" value={3} />
      </View>

      <Text style={styles.sectionTitle}>Your Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
          />
        )}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#667eea', padding: 20 },
  greeting: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  statsContainer: { flexDirection: 'row', gap: 10, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', padding: 15, marginTop: 10 },
});
```

## 🔄 Redux State Management

**authReducer.js**
```javascript
const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case 'LOGIN_REQUEST':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
}
```

## 🌐 Navigation Structure

**RootNavigator.js**
```javascript
import React from 'react';
import { useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            {user?.role === 'admin' || user?.role === 'manager' ? (
              <Stack.Screen name="AdminNavigator" component={AdminNavigator} />
            ) : null}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `axios` | HTTP requests |
| `react-navigation` | Navigation |
| `redux` | State management |
| `@stripe/stripe-react-native` | Payment processing |
| `socket.io-client` | Real-time updates |
| `react-native-calendars` | Date selection |
| `react-native-star-rating` | Review ratings |

## 🚀 Building & Running

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android

# Build for production (iOS)
cd ios && xcodebuild -workspace HotelBookingMobile.xcworkspace -scheme HotelBookingMobile -configuration Release

# Build for production (Android)
cd android && ./gradlew assembleRelease
```

## 📋 Implementation Phases

### Phase 1: Core Features (Week 1-2)
- [ ] Authentication screens
- [ ] Room listing
- [ ] Basic booking

### Phase 2: Advanced Features (Week 3-4)
- [ ] Payment integration
- [ ] Reviews system
- [ ] Real-time updates

### Phase 3: Admin Features (Week 5)
- [ ] Admin panel
- [ ] Analytics
- [ ] Offer management

### Phase 4: Polish (Week 6)
- [ ] Offline support
- [ ] Local caching
- [ ] Performance optimization

## 🔐 Security Best Practices

- Store JWT tokens securely using `react-native-keychain`
- Never store sensitive data in AsyncStorage
- Use HTTPS only for API calls
- Validate all user inputs
- Implement certificate pinning

## 🎨 Design Guidelines

- Use mobile-first approach
- Touch-friendly buttons (min 44x44pt)
- Support both light and dark themes
- Ensure 60 FPS performance
- Test on real devices (not just emulators)