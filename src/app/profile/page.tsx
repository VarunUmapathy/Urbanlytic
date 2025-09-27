
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneLayout } from "@/components/phone-layout";
import { useAuth } from "@/firebase/provider";
import {
  getAuth,
  signOut,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { useFirebaseApp } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  ChevronRight,
  User as UserIcon,
  Loader2,
  KeyRound,
  BarChart2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const firebaseApp = useFirebaseApp();
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  const { toast } = useToast();

  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const isGoogleSignIn = user?.providerData.some(
    (provider) => provider.providerId === "google.com"
  );
  
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      setNewName(user.displayName || "");
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out.",
      });
    }
  };

  const handleNameUpdate = async () => {
    if (!user || !newName.trim()) return;

    setIsSubmitting(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: newName.trim() });

      // Update Firestore document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { name: newName.trim() });

      toast({
        title: "Success",
        description: "Your name has been updated.",
      });
      setIsNameDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your name.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user || !currentPassword || !newPassword) return;

    setIsSubmitting(true);
    try {
      if (!user.email) {
        throw new Error("Cannot change password for users without an email.");
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      // Re-authenticate user to verify their current password
      await reauthenticateWithCredential(user, credential);
      
      // If re-authentication is successful, update the password
      await updatePassword(user, newPassword);

      toast({
        title: "Success",
        description: "Your password has been changed.",
      });
      setIsPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");

    } catch (error: any) {
       let errorMessage = "An unexpected error occurred.";
       if (error.code === 'auth/wrong-password') {
         errorMessage = "The current password you entered is incorrect.";
       } else if (error.code === 'auth/weak-password') {
         errorMessage = "The new password is too weak. It must be at least 6 characters long.";
       } else if (error.code === 'auth/requires-recent-login') {
         errorMessage = "This is a sensitive action. Please log out and log back in before changing your password.";
       }
        
       toast({
         variant: "destructive",
         title: "Password Update Failed",
         description: errorMessage,
         duration: 9000,
       });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading || !user) {
    return (
       <PhoneLayout>
         <div className="flex flex-col items-center justify-center h-full">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
         </div>
       </PhoneLayout>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AU";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <PhoneLayout>
      <Header title="Profile" />

      <main className="flex-grow pt-16 overflow-y-auto bg-muted/30">
        <div className="flex flex-col items-center pt-8 pb-12">
          <Avatar className="w-24 h-24 mb-4 border-4 border-background shadow-md">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold font-headline">
            {user.displayName || "Anonymous User"}
          </h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        <div className="space-y-4 px-4">
          <div className="bg-card rounded-lg border">
            <h3 className="text-sm font-semibold text-muted-foreground px-4 pt-4">
              Account Settings
            </h3>
            <div className="p-2">
              <button
                onClick={() => setIsNameDialogOpen(true)}
                className="flex items-center justify-between w-full p-2 text-left rounded-md hover:bg-muted"
                disabled={isGoogleSignIn}
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-primary" />
                  <span>Edit Name</span>
                </div>
                 {isGoogleSignIn ? (
                    <span className="text-xs text-muted-foreground">Via Google</span>
                ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              <Separator className="my-1" />

               <button
                onClick={() => setIsPasswordDialogOpen(true)}
                className="flex items-center justify-between w-full p-2 text-left rounded-md hover:bg-muted"
                disabled={isGoogleSignIn}
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-primary" />
                  <span>Change Password</span>
                </div>
                {isGoogleSignIn ? (
                    <span className="text-xs text-muted-foreground">Via Google</span>
                ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg border">
            <h3 className="text-sm font-semibold text-muted-foreground px-4 pt-4">
              Developer
            </h3>
            <div className="p-2">
              <Link href="/analytics" className="flex items-center justify-between w-full p-2 text-left rounded-md hover:bg-muted">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  <span>View Analytics</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          <div className="bg-card rounded-lg border">
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="flex items-center justify-between w-full p-2 text-left text-destructive rounded-md hover:bg-destructive/10"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <span>Log Out</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Name Dialog */}
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Name</DialogTitle>
            <DialogDescription>
              Enter your full name. This will be visible to others.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleNameUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password. The new password must be at least 6 characters long.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handlePasswordUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhoneLayout>
  );
}
