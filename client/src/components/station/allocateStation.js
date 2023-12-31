import React, { useEffect, useState } from "react";
import { Table, Button, Form } from 'react-bootstrap';
import Select from 'react-select'
import { useFormik } from "formik";
import toast, { Toaster } from 'react-hot-toast';
import Multiselect from "multiselect-react-dropdown";
import { getAllStationNames, getAllWorkerNames, addStationAllocation, getActiveShiftNames, getWorkerAllocation } from "../../helper/helper";
import WindalsNav from "../navbar";

function StationAllocation() {
    const today = new Date();

    const [workers, setWorkers] = useState([]);
    const [workersCompleteName, setWorkersCompleteName] = useState({});
    const [stations, setStations] = useState([]);
    const [allocationStation, setAllocationStation] = useState([]);
    const [availableWorkerNames, setAvailableWorkerNames] = useState([]);
    const [selectedWorkers, setSelectedWorkers] = useState([]); // Maintain a list of selected workers
    const [activeShiftNames,setActiveShiftNames] = useState([]);
    const [allocatedData,setallocatedData] = useState([]);
    
    useEffect(() => {
        fetchStationsAndWorkers();
        const getActiveShiftNamesPromise = getActiveShiftNames()
        getActiveShiftNamesPromise.then((result)=>{
            setActiveShiftNames(result)
        }).catch((err)=>{
            toast.error(err.msg)
        })
    }, []);

    const fetchStationsAndWorkers = async () => {
        try {
            const stationNames = await getAllStationNames();
            setStations(stationNames);

            const workerNames = await getAllWorkerNames();
            setWorkers(workerNames);

            const tempObj = {};

            for (const w of workerNames) {
                const { first_name, last_name, employee_id, user_name } = w;
                tempObj[first_name + " " + last_name + " " + user_name] = { employee_id, name: first_name + " " + last_name + " " + user_name };
            }

            setWorkersCompleteName(tempObj);

            // Initialize allocationStation based on stations
            const initialAllocationStation = stationNames.map((station) => ({
                station: station.station_name,
                workers: [],
            }));
            setAllocationStation(initialAllocationStation);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    const formik = useFormik({
        initialValues: {
            date: today.toISOString().substring(0, 10),
            shift: '',
            stationAllocations: allocationStation,
        },
        onSubmit: (values) => {
            // Ensure that all stations have at least one worker
            const isValid = values.stationAllocations.every(
                (allocation) => allocation.workers.length > 0
            );

            if (!isValid) {
                toast.error("All stations must have at least one worker.");
            } else {
                // Map selected names to employee_ids when submitting the form
                const stationAllocationsWithEmployeeIds = values.stationAllocations.map((allocation) => ({
                    station: allocation.station,
                    workers: allocation.workers.map((selectedName) => workersCompleteName[selectedName].employee_id),
                }));

                console.log({
                    date: values.date,
                    shift: values.shift,
                    stationAllocations: stationAllocationsWithEmployeeIds
                });
                 const addStationAllocationPromise = addStationAllocation({
                    date: values.date,
                    shift: values.shift.value,
                    stationAllocations: stationAllocationsWithEmployeeIds,
                });

                toast.promise(addStationAllocationPromise, {
                    loading: "Saving data",
                    success: (result) => {
                        formik.resetForm()
                        fetchStationsAndWorkers()
                        getStationAllocationData()
                        formik.setFieldValue("stationAllocations",allocationStation)
                        return result.msg
                    },
                    error: (err) => err.msg,
                });
            }
        },
        enableReinitialize: true,
    });

    useEffect(() => {
        filterAvailableWorkerNames();
    }, [formik.values.stationAllocations]);

    function handleSelect(selectedList, selectedItem, stationIndex) {
        console.log({ selectedItem: selectedItem, selectedList: selectedList });
        // Update the selected names for a specific station
        const updatedAllocation = [...formik.values.stationAllocations];
        updatedAllocation[stationIndex].workers = selectedList;
        formik.setFieldValue("stationAllocations", updatedAllocation);
        filterAvailableWorkerNames();
    }

    const filterAvailableWorkerNames = () => {
        // Combine the selected workers from all stations
        const allSelectedWorkers = formik.values.stationAllocations.flatMap((allocation) => allocation.workers);
        // Filter out workers that are already selected
        const filteredAvailableWorkerNames = workers.filter((worker) => {
            const workerName = `${worker.first_name} ${worker.last_name} ${worker.user_name}`;
            return !allSelectedWorkers.includes(workerName);
        });
        setAvailableWorkerNames(filteredAvailableWorkerNames);
    }

    useEffect(()=>{
        getStationAllocationData()
    },[])

    const getStationAllocationData = () => {
        const getAllocatedPromise = getWorkerAllocation()
        getAllocatedPromise.then(async(result)=>{
            setallocatedData(result)
        }).catch((err)=>{})
    }

    console.log({allocatedData:allocatedData});
    // console.log({ availableWorkerNames: availableWorkerNames });
    return (
        <div>
            <Toaster position="top-center" reverseOrder={false}></Toaster>
            <WindalsNav/>
            <div>
                <Form onSubmit={formik.handleSubmit}>
                    <Form.Group controlId="date">
                        <Form.Label>Date:</Form.Label>
                        <Form.Control
                            type="date"
                            name="date"
                            onChange={formik.handleChange}
                            value={formik.values.date}
                        />
                        {formik.touched.date && formik.errors.date && (
                            <div className="error">{formik.errors.date}</div>
                        )}
                    </Form.Group>

                    <Form.Group controlId="shift">
                        <Form.Label>Shift:</Form.Label>
                        <Select
                            options={activeShiftNames.map((shift) => ({ label: shift.shift_name, value: shift.shift_id }))}
                            value={formik.values.shift}
                            name="shift"
                            onChange={(data) => formik.setFieldValue("shift", data)}
                            isSearchable={true}
                        />
                        {formik.touched.shift && formik.errors.shift && (
                            <div className="error">{formik.errors.shift}</div>
                        )}
                    </Form.Group>

                    <Button variant="danger" type="submit">
                        Submit
                    </Button>
                </Form>
             </div>

             <div className="table-container">
                <Table striped responsive hover className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Station</th>
                            <th>Worker</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formik.values.stationAllocations.map((allocation, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{allocation.station}</td>
                                <td>
                                    <Multiselect
                                        isObject={false}
                                        options={availableWorkerNames.map(
                                            (worker) => `${worker.first_name} ${worker.last_name} ${worker.user_name}`
                                        )}
                                        onSelect={(selectedList, selectedItem) =>
                                            handleSelect(selectedList, selectedItem, index)
                                        }
                                        selectedValues={allocation.workers}
                                        showCheckbox
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <Table striped responsive hover className='table'>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Station</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>User Name</th>
                        <th>Shift Name</th>
                    </tr>
                </thead>
                <tbody>
                {
                
                Array.isArray(allocatedData) && allocatedData.map((allocateddata,index)=>(
                   <tr key={index}>
                        <td>
                            {index+1}
                        </td>
                        <td>
                            {allocateddata.date}
                        </td>
                        <td>
                            {allocateddata.station_name}
                        </td>
                        <td>
                            {allocateddata.first_name}
                        </td>
                        <td>
                            {allocateddata.last_name}
                        </td>
                        <td>
                            {allocateddata.user_name}
                        </td>
                        <td>
                            {allocateddata.shift_name}
                        </td>
                        
                    </tr>
                ))
                }

                </tbody>
            </Table>
    </div>
    );
}

export default StationAllocation;
