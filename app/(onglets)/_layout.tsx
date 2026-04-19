import { DashboardBottomNav } from '@/components/navigation/DashboardBottomNav';
import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function OngletsLayout() {
    return (
        <View style={styles.root}>
            <Stack screenOptions={{ headerShown: false }} />
            <DashboardBottomNav />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
});
