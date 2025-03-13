
import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProfileForm from '@/components/ui-custom/ProfileForm';
import AnimatedText from '@/components/ui-custom/AnimatedText';

const ProfilePage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">
          <AnimatedText gradient>Profile</AnimatedText>
        </h1>
        <p className="text-muted-foreground">
          <AnimatedText delay={100}>
            Manage your account details and preferences
          </AnimatedText>
        </p>
      </div>
      
      <ProfileForm />
    </DashboardLayout>
  );
};

export default ProfilePage;
