
import React, { useEffect, useState } from "react"
import { StyleSheet, Text, View, Button,FlatList , TouchableOpacity, Modal,Image, Dimensions} from "react-native"
import * as TaskManager from "expo-task-manager"
import * as Location from "expo-location"
// import { initializeApp } from 'firebase/app'
import { ref, set, update} from 'firebase/database';
import {db} from './component/config';
import Icon from 'react-native-vector-icons/FontAwesome';


const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const LOCATION_TASK_NAME = "LOCATION_TASK_NAME"
let foregroundSubscription = null
let backPosition = null

let updateLocation = (location) => {
  update(ref(db, '/am/1'), { lat: location.latitude, long: location.longitude})
  .then(() => console.log("Data successfully updated!"))
  .catch((error) => console.error("Error updating data: ", error));
};

// Define the background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error)
    return
  }
  if (data) {
    // Extract location coordinates from data
    const { locations } = data
    const location = locations[0]
    if (location) {
      console.log("Location in background", location)
      backPosition = location.coords;
      updateLocation(location.coords)
      // push to firebase 

    }
  }
})

// https://jsonplaceholder.typicode.com/todos/1

export default function App() {
  // Define position state: {latitude: number, longitude: number}
  const [position, setPosition] = useState(null);
  const [isBackgroundUpdateRunning, setIsBackgroundUpdateRunning] = useState(false);
  const [isForegroundUpdateRunning, setIsForegroundUpdateRunning] = useState(false);
  const [data, setData] = useState([]);
  // const [data, setData] = useState([
  //   { id: "1", title: "Tile 1", description: "Description for tile 1" },
  //   { id: "2", title: "Tile 2", description: "Description for tile 2" },
  //   { id: "3", title: "Tile 3", description: "Description for tile 3" },
  // ]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTilePress = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };


const storageHighScore =async(userId,score) =>{
  set( ref(db,'/am/'),{username:"userId",highscore:"score"}).then(()=>console.log("aaaaaaaa")).catch(err=>console.log);
  // update(ref(db, '/am/' + userId), { username: "userId", highscore: "score" })
  // .then(() => console.log("Data successfully updated!"))
  // .catch((error) => console.error("Error updating data: ", error));
   
}



  const toggleForegroundUpdate = () => {
    if (isForegroundUpdateRunning) {
      stopForegroundUpdate();
    } else {
      startForegroundUpdate();
    }
    setIsForegroundUpdateRunning(!isForegroundUpdateRunning);
  }

  const toggleBackgroundUpdate = () => {
    if (isBackgroundUpdateRunning) {
      stopBackgroundUpdate();
    } else {
      startBackgroundUpdate();
    }
    setIsBackgroundUpdateRunning(!isBackgroundUpdateRunning);
  }

  // Request permissions right after starting the app
  useEffect(() => {
    const requestPermissions = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync()
      if (foreground.granted) await Location.requestBackgroundPermissionsAsync()
    }
    requestPermissions()
    fetchData();
  }, [])
  const fetchData = async () => {
    // Fetch data from API and update state
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/');
    const json = await response.json();
    // setData(json);
    // Modify each object in the array
  const modifiedData = json.map(item => {
    return {
      ...item,
      images: ['https://img.freepik.com/premium-photo/blue-premium-business-sedan-car-sports-configuration-white-background-3d-rendering_101266-26564.jpg','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8KpqGZztwXtgkUFZhQG081g6rUXfvsae_lW4d_TVf&s']
    };
  });
  
  setData(modifiedData);
    console.log("ghghk", json)
  };
 
  const renderItem = ({ item }) => (
    <View>
      <Text>{item.userId}</Text>
      <Text>{item.title}</Text>
    </View>
  );

  // Start location tracking in foreground
  const startForegroundUpdate = async () => {
    // Check if foreground permission is granted
    const { granted } = await Location.getForegroundPermissionsAsync()
    if (!granted) {
      console.log("location tracking denied")
      return
    }

    // Make sure that foreground location tracking is not running
    foregroundSubscription?.remove()

    // Start watching position in real-time
    foregroundSubscription = await Location.watchPositionAsync(
      {
        // For better logs, we set the accuracy to the most sensitive option
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,//when 5m change of distance
      },
      location => {
        setPosition(location.coords)
        updateLocation(location.coords)
        // push to firebase
      }
    )
  }

  // Stop location tracking in foreground
  const stopForegroundUpdate = () => {
    foregroundSubscription?.remove()
    setPosition(null)
  }

  // Start location tracking in background
  const startBackgroundUpdate = async () => {
    // Don't track position if permission is not granted
    const { granted } = await Location.getBackgroundPermissionsAsync()
    if (!granted) {
      console.log("location tracking denied")
      return
    }

    // Make sure the task is defined otherwise do not start tracking
    const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME)
    if (!isTaskDefined) {
      console.log("Task is not defined")
      return
    }

    // Don't track if it is already running in background
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    )
    if (hasStarted) {
      console.log("Already started")
      return
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      // For better logs, we set the accuracy to the most sensitive option
      accuracy: Location.Accuracy.BestForNavigation,
      // timeInterval: 60000,
      distanceInterval: 5,
      // Make sure to enable this notification if you want to consistently track in the background
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Location",
        notificationBody: "Location tracking in background",
        notificationColor: "#fff",
      },
    })
  }

  // Stop location tracking in background
  const stopBackgroundUpdate = async () => {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      LOCATION_TASK_NAME
    )
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      console.log("Location tracking stopped")
    }
  }
  const deleteItem = (itemId) => {
    setData(prevData => prevData.filter(item => item.id !== itemId));
  }
  

  return (
    
    
    <View style={styles.container}>
     

<FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tile} onPress={() => handleTilePress(item)}>
            <Text style={styles.tileTitle}>{item.title}</Text>
            {/* <Button title="Delete" onPress={() => deleteItem(item.id)} /> */}
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleTilePress(item)}>
              <Icon name="trash" size={24} color="red" onPress={() => deleteItem(item.id)} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.title}>{selectedItem?.title}</Text>
          <Text style={styles.userId}>{selectedItem?.userId}</Text>
          <FlatList
          data={selectedItem?.images}
          keyExtractor={(item, index) => index.toString()}
          // horizontal={true}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.imageTile} />
          )}
        />

          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
  

        {/* <Text>Longitude: {position?.longitude}</Text>
      <Text>Latitude: {position?.latitude}</Text> */}
      <View style={styles.separator} />
      <Button
        onPress={toggleForegroundUpdate}
        // onPress={() => storageHighScore("1", 450)}
        title={isForegroundUpdateRunning ? "Stop in foreground" : "Start in foreground"}
        color={isForegroundUpdateRunning ? "red" : "green"}
      />
      <View style={styles.separator} />
     

      <Button
        onPress={toggleBackgroundUpdate}
        title={isBackgroundUpdateRunning ? "Stop in background" : "Start in background"}
        color={isBackgroundUpdateRunning ? "red" : "green"}
      />
    </View>
  )
}


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "flex-end",
//     marginBottom: 36, // add some margin to account for the device's bottom bar
//   },
//   tile: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     margin: 10,
//   },
//   switchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   button: {
//     marginTop: 15,
//     marginLeft: 20, // add some margin to separate the two buttons
//   },
//   separator: {
//     marginVertical: 8,
//   },
// })
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 10,
    width: "100%",
  },
  tile: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
  },
  tileTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  tileText: {
    fontSize: 14,
    color: "#555",
  },

  modal: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  imageTile: {
    width: windowWidth,
    height: windowHeight / 2,
    margin: 5,
    resizeMode: 'contain',
    borderRadius: 5,
  },
  userId: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#ff0000",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
 
});

