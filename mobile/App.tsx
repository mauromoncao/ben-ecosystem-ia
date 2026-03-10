import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import WorkspaceScreen from './src/screens/WorkspaceScreen'
import ChatScreen from './src/screens/ChatScreen'
import DrawerContent from './src/screens/DrawerContent'
import { RootStackParamList, DrawerParamList } from './src/types'

const Stack  = createNativeStackNavigator<RootStackParamList>()
const Drawer = createDrawerNavigator<DrawerParamList>()

// ─── Drawer Navigator (workspace + drawer) ───────────────────────────────────
function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={() => <DrawerContent />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 320 },
        drawerPosition: 'left',
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Workspace" component={WorkspaceScreen} />
    </Drawer.Navigator>
  )
}

// ─── Stack Navigator principal ────────────────────────────────────────────────
function AppNavigator() {
  const { isAuthenticated } = useAuth()

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainDrawer" component={MainDrawer} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
