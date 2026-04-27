import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import socket from '../../socket/socket';
import { RootState } from '../../store';
import { setEmployees, addEmployee } from '../../store/slices/employeeSlice';
import { getEmployees, createEmployee } from '../../services/employeeService';

const EmployeesScreen = () => {
  const dispatch = useDispatch<any>();
  const employees = useSelector(
    (state: RootState) => state.employee.employees
  );

  const [name, setName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getEmployees();
        dispatch(setEmployees(data));
      } catch (err) {
        console.log('Error loading employees');
      }
    };

    loadData();

    const handleEmployee = (data: any) => {
      dispatch(addEmployee(data));
    };

    socket.on('employeeCreated', handleEmployee);

    return () => {
      socket.off('employeeCreated', handleEmployee);
    };
  }, []);

  const handleAdd = async () => {
    if (!name) return;

    await createEmployee({ name });
    setName('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Employee Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <Button title="Add Employee" onPress={handleAdd} />

      <FlatList
        data={employees}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.name}</Text>
        )}
      />
    </View>
  );
};

export default EmployeesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  item: {
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
  },
});