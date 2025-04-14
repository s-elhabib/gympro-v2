import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import * as classService from '../services/classService';
import { Class } from '../services/classService';
import { ClassFormValues } from '../lib/validations/class';

export function useClasses() {
  const { addNotification } = useNotifications();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Fetch classes using the service with retry mechanism
  const fetchClasses = useCallback(async (retryCount = 0) => {
    let isRetrying = false;

    try {
      setIsLoading(true);
      console.log(`Fetching classes from service... (attempt ${retryCount + 1})`);
      const data = await classService.fetchClasses();
      console.log('Classes fetched successfully:', data.length);
      setClasses(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching classes:", error);

      // Retry up to 3 times with exponential backoff
      if (retryCount < 2) {
        isRetrying = true;
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${delay}ms...`);
        setTimeout(() => fetchClasses(retryCount + 1), delay);
      } else {
        // Only show notification if we've exhausted all retries
        addNotification({
          title: "Erreur",
          message: "Impossible de récupérer les cours. Veuillez rafraîchir la page.",
          type: "error",
        });
        // Return an empty array to prevent further errors
        setClasses([]);
        setIsLoading(false);
      }
    }
  }, [addNotification]);

  // Add a new class
  const addClass = useCallback(async (data: ClassFormValues) => {
    try {
      console.log('Adding new class...');
      // Use the service to add the class
      const newClass = await classService.addClass(data);
      console.log('Class added successfully:', newClass.id);

      // Update the local state and refresh data from the server
      setClasses(prevClasses => [newClass, ...prevClasses]);

      // Refresh the data to ensure we have the latest state
      console.log('Refreshing classes data after add...');
      fetchClasses();

      addNotification({
        title: "Succès",
        message: "Cours ajouté avec succès",
        type: "success",
      });

      return newClass;
    } catch (error) {
      console.error("Error adding class:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de l'ajout du cours",
        type: "error",
      });
      throw error;
    }
  }, [addNotification, fetchClasses]);

  // Update an existing class
  const updateClass = useCallback(async (id: string, data: ClassFormValues) => {
    try {
      console.log('Updating class:', id);
      // Use the service to update the class
      const updatedClass = await classService.updateClass(id, data);
      console.log('Class updated successfully:', updatedClass.id);

      // Update the local state
      setClasses(prevClasses =>
        prevClasses.map(cls => cls.id === id ? updatedClass : cls)
      );

      // Refresh the data to ensure we have the latest state
      console.log('Refreshing classes data after update...');
      fetchClasses();

      addNotification({
        title: "Succès",
        message: "Cours mis à jour avec succès",
        type: "success",
      });

      return updatedClass;
    } catch (error) {
      console.error("Error updating class:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de la mise à jour du cours",
        type: "error",
      });
      throw error;
    }
  }, [addNotification, fetchClasses]);

  // Delete a class
  const deleteClass = useCallback(async (id: string) => {
    try {
      console.log('Deleting class:', id);
      // Use the service to delete the class
      await classService.deleteClass(id);
      console.log('Class deleted successfully');

      // Update the local state
      setClasses(prevClasses => prevClasses.filter(cls => cls.id !== id));

      // Refresh the data to ensure we have the latest state
      console.log('Refreshing classes data after delete...');
      fetchClasses();

      addNotification({
        title: "Succès",
        message: "Cours supprimé avec succès",
        type: "success",
      });
    } catch (error) {
      console.error("Error deleting class:", error);
      addNotification({
        title: "Erreur",
        message: "Échec de la suppression du cours",
        type: "error",
      });
      throw error;
    }
  }, [addNotification, fetchClasses]);

  // Fetch classes on component mount, when the component becomes visible, or when location changes
  useEffect(() => {
    console.log("Fetching classes data...");
    fetchClasses();

    // Set up event listener for when the page becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Page became visible, refreshing classes data...");
        fetchClasses();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up the event listener
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [location.pathname, fetchClasses]); // Re-run when the location changes or fetchClasses changes

  return {
    classes,
    isLoading,
    fetchClasses,
    addClass,
    updateClass,
    deleteClass
  };
}
