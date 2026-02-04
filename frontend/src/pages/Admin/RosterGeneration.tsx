import { useState } from 'react'

interface Staff {
  id: string
  name: string
  department: string
}

interface Assignment {
  staffId: string
  staffName: string
}

function RosterGeneration() {
  const [selectedDepartment, setSelectedDepartment] = useState('Emergency')
  const [draggedStaff, setDraggedStaff] = useState<Staff | null>(null)
  
  const availableStaff: Staff[] = [
    { id: '1', name: 'Dr. Sarah Chen', department: 'Cardiology' },
    { id: '2', name: 'Dr. Michael Wong', department: 'Emergency' },
    { id: '3', name: 'Dr. Emily Rodriguez', department: 'Surgery' },
    { id: '4', name: 'Dr. James Taylor', department: 'Anesthesiology' },
    { id: '5', name: 'Dr. Lisa Anderson', department: 'Pediatrics' },
    { id: '6', name: 'Dr. David Kim', department: 'Radiology' }
  ]

  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({})

  const departments = ['Emergency', 'ICU', 'Surgery', 'Cardiology']
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const shifts = ['Morning Shift', 'Afternoon Shift', 'Night Shift']

  const handleDragStart = (staff: Staff) => {
    setDraggedStaff(staff)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (shiftType: string, day: string) => {
    if (draggedStaff) {
      const key = `${shiftType}-${day}`
      const newAssignment = {
        staffId: draggedStaff.id,
        staffName: draggedStaff.name
      }
      
      setAssignments({
        ...assignments,
        [key]: [...(assignments[key] || []), newAssignment]
      })
      setDraggedStaff(null)
    }
  }

  const handleRemoveAssignment = (key: string, staffId: string) => {
    const newAssignments = { ...assignments }
    if (newAssignments[key]) {
      newAssignments[key] = newAssignments[key].filter(a => a.staffId !== staffId)
      if (newAssignments[key].length === 0) {
        delete newAssignments[key]
      }
    }
    setAssignments(newAssignments)
  }

  const totalShifts = 147
  const assignedShifts = Object.values(assignments).reduce((sum, arr) => sum + arr.length, 0)
  const unassignedShifts = totalShifts - assignedShifts
  const coverage = Math.round((assignedShifts / totalShifts) * 100)

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Roster Generation</h2>
          <p className="text-sm text-gray-500 mt-1">Drag and drop staff to assign shifts</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span className="font-medium">Save Draft</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="font-medium">Publish Schedule</span>
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2 text-gray-700">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">Week of June 10 - 16, 2024</span>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Available Staff Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Staff</h3>
            <div className="space-y-2">
              {availableStaff.map((staff) => (
                <div
                  key={staff.id}
                  draggable
                  onDragStart={() => handleDragStart(staff)}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md active:scale-95"
                >
                  <div className="font-medium text-gray-800">{staff.name}</div>
                  <div className="text-sm text-blue-600 mt-1">{staff.department}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Roster Schedule */}
        <div className="col-span-9">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {/* Department Tabs */}
            <div className="flex items-center gap-8 mb-6 border-b border-gray-200">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`pb-3 font-medium transition-all duration-200 ${
                    selectedDepartment === dept
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Shifts Schedule */}
            <div className="space-y-8">
              {shifts.map((shift) => (
                <div key={shift}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h4 className="text-base font-semibold text-gray-800">{shift}</h4>
                  </div>
                  
                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-4">
                    {days.map((day) => {
                      const key = `${shift}-${day}`
                      const assignmentList = assignments[key] || []
                      
                      return (
                        <div key={day} className="text-center">
                          <div className="text-sm font-medium text-gray-600 mb-2">{day}</div>
                          <div
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(shift, day)}
                            className={`min-h-24 border-2 border-dashed rounded-lg transition-all duration-200 p-2 ${
                              assignmentList.length > 0
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {assignmentList.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {assignmentList.map((assignment) => (
                                  <div key={assignment.staffId} className="relative group bg-white rounded px-2 py-1 border border-green-200">
                                    <div className="text-xs font-medium text-gray-800 truncate pr-4">
                                      {assignment.staffName.replace('Dr. ', 'Dr. ')}
                                    </div>
                                    <button
                                      onClick={() => handleRemoveAssignment(key, assignment.staffId)}
                                      className="absolute top-1 right-1 p-0.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50"
                                    >
                                      <svg className="w-2.5 h-2.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-20 flex items-center justify-center text-gray-400">
                                {/* Empty slot */}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mt-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Total Shifts</div>
          <div className="text-4xl font-bold text-gray-800">{totalShifts}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Assigned</div>
          <div className="text-4xl font-bold text-green-600">{assignedShifts}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Unassigned</div>
          <div className="text-4xl font-bold text-orange-600">{unassignedShifts}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-2">Coverage</div>
          <div className="text-4xl font-bold text-blue-600">{coverage}%</div>
        </div>
      </div>
    </div>
  )
}

export default RosterGeneration
