import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

interface Staff {
  id: string
  name: string
  department: string
  role: string
  status: string
  statusColor: string
  email: string
  phone: string
  shifts: number
  initials: string
}

interface Assignment {
  staffId: string
  staffName: string
  department?: string
  isPublished?: boolean // Track if this assignment is from database
}

const padNumber = (value: number) => String(value).padStart(2, '0')

const getAssignmentKey = (year: number, month: number, day: number, shiftType: string) => {
  return `${year}-${padNumber(month)}-${padNumber(day)}-${shiftType}`
}

const parseAssignmentKey = (key: string) => {
  const keyMatch = key.match(/^(\d{4})-(\d{1,2})-(\d{1,2})-(.+)$/)
  if (!keyMatch) {
    return null
  }

  return {
    year: Number(keyMatch[1]),
    month: Number(keyMatch[2]),
    day: Number(keyMatch[3]),
    shiftType: keyMatch[4]
  }
}

const normalizeAssignmentMap = (inputAssignments: Record<string, Assignment[]>) => {
  const normalized: Record<string, Assignment[]> = {}

  Object.entries(inputAssignments).forEach(([rawKey, assignmentList]) => {
    const parsed = parseAssignmentKey(rawKey)
    if (!parsed) {
      return
    }

    const normalizedKey = getAssignmentKey(parsed.year, parsed.month, parsed.day, parsed.shiftType)
    const currentAssignments = normalized[normalizedKey] || []

    const merged = [...currentAssignments]
    assignmentList.forEach((assignment) => {
      const alreadyExists = merged.some((existing) => existing.staffId === assignment.staffId)
      if (!alreadyExists) {
        merged.push(assignment)
      }
    })

    normalized[normalizedKey] = merged
  })

  return normalized
}

function RosterGeneration() {
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments')
  const [draggedStaff, setDraggedStaff] = useState<Staff | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({})

  // Fetch staff members on component mount
  useEffect(() => {
    fetchStaffMembers()
  }, [])

  // Fetch published shifts when month/year changes
  useEffect(() => {
    fetchPublishedShifts()
  }, [currentDate])

  const fetchStaffMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/staff')
      const data = await response.json()

      if (data.success) {
        setAvailableStaff(data.staff)
      } else {
        setError('Failed to load staff members')
      }
    } catch (err) {
      console.error('Error fetching staff:', err)
      setError('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const fetchPublishedShifts = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const response = await fetch(`http://localhost:3001/api/shifts/published/${year}/${month}`)
      const data = await response.json()

      if (data.success && data.shifts) {
        // Convert published shifts to assignment format for display
        const publishedAssignments: Record<string, Assignment[]> = {}
        
        console.log('Published shifts from backend:', data.shifts);
        
        Object.entries(data.shifts).forEach(([key, doctors]: [string, any]) => {
          // key is in format "YYYY-MM-DD-ShiftType"
          // Match the date part (YYYY-MM-DD) and everything after as shift type
          const keyMatch = key.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/)
          
          if (keyMatch) {
            const [, keyYear, keyMonth, keyDay, shiftType] = keyMatch
            const assignmentKey = getAssignmentKey(
              Number(keyYear),
              Number(keyMonth),
              Number(keyDay),
              shiftType
            )
            
            console.log(`Parsing: ${key} -> ${assignmentKey}`);
            
            publishedAssignments[assignmentKey] = doctors.map((doc: any) => ({
              staffId: doc.doctorId,
              staffName: doc.doctor,
              isPublished: true // Mark as published from database
            }))
          } else {
            console.warn('Failed to parse key:', key);
          }
        })
        
        console.log('Converted published assignments:', publishedAssignments);
        
        // Merge published shifts with draft assignments (drafts take precedence)
        setAssignments(prev => normalizeAssignmentMap({
          ...publishedAssignments,
          ...prev // Draft assignments override published ones
        }))
      }
    } catch (err) {
      console.error('Error fetching published shifts:', err)
      // Don't show error for this - it's optional
    }
  }

  const handlePublishSchedule = async () => {
    console.log('=== PUBLISH SCHEDULE CLICKED ===');
    console.log('Current assignments:', assignments);
    console.log('Assigned shifts count:', assignedShifts);
    
    if (assignedShifts === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Assignments',
        text: 'Please assign staff to shifts before publishing the schedule',
        confirmButtonColor: '#3b82f6'
      })
      return
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Publish Schedule?',
      html: `<div class="text-left">
        <p class="mb-2">You are about to publish the schedule with:</p>
        <ul class="list-disc list-inside">
          <li><strong>${assignedShifts}</strong> shifts assigned</li>
          <li><strong>${unassignedShifts}</strong> shifts unassigned</li>
          <li><strong>${coverage}%</strong> coverage</li>
        </ul>
        <p class="mt-3 text-sm text-gray-600">This action will save all assignments to the database and make them visible to staff members.</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'Publish Schedule',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280'
    })

    if (result.isConfirmed) {
      setPublishing(true)
      console.log('User confirmed publish. Sending to backend...');
      console.log('Payload:', {
        assignments,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });
      
      try {
        const response = await fetch('http://localhost:3001/api/shifts/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assignments,
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
          })
        })

        const data = await response.json()
        console.log('Backend response:', data);

        if (data.success) {
          // Fetch the published shifts to reload them and mark as published in the UI
          try {
            const publishedResponse = await fetch(
              `http://localhost:3001/api/shifts/published/${currentDate.getFullYear()}/${currentDate.getMonth() + 1}`
            );
            const publishedData = await publishedResponse.json();

            // Update assignments with published shifts
            if (publishedData.success && publishedData.shifts) {
              const publishedAssignments: Record<string, Assignment[]> = {}
              
              Object.entries(publishedData.shifts).forEach(([key, doctors]: [string, any]) => {
                // key is in format "YYYY-MM-DD-ShiftType"
                const keyMatch = key.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/)
                
                if (keyMatch) {
                  const [, keyYear, keyMonth, keyDay, shiftType] = keyMatch
                  const assignmentKey = getAssignmentKey(
                    Number(keyYear),
                    Number(keyMonth),
                    Number(keyDay),
                    shiftType
                  )
                  
                  publishedAssignments[assignmentKey] = doctors.map((doc: any) => ({
                    staffId: doc.doctorId,
                    staffName: doc.doctor,
                    isPublished: true // Mark as published from database
                  }))
                }
              })
              
              // Replace assignments with published versions to show them as published (blue)
              setAssignments(normalizeAssignmentMap(publishedAssignments))
            }

            let shiftDetails = '';
            if (publishedData.success && publishedData.totalShifts > 0) {
              const shiftEntries = Object.entries(publishedData.shifts).slice(0, 3) as [string, any[]][];
              shiftDetails = '<div class="mt-3 text-sm text-gray-600">';
              shiftEntries.forEach(([key, doctors]) => {
                const keyMatch = key.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)$/)
                const shiftType = keyMatch ? keyMatch[4] : key
                shiftDetails += `<div class="mb-2"><strong>${shiftType}:</strong> ${doctors.map((doctor) => doctor.doctor).join(', ')}</div>`;
              });
              shiftDetails += '</div>';
            }

            await Swal.fire({
              icon: 'success',
              title: 'Schedule Published!',
              html: `<div class="text-left">
                <p class="mb-2">Your schedule has been published successfully!</p>
                <p class="text-sm text-gray-600"><strong>${data.shiftsCreated}</strong> shifts have been added to the system.</p>
                ${shiftDetails}
                <p class="text-xs text-gray-500 mt-3">Assignments are now visible on the calendar as published shifts (blue badges).</p>
              </div>`,
              confirmButtonColor: '#3b82f6'
            })

            // Dispatch custom event to notify other components (like AdminDashboard) to refresh
            window.dispatchEvent(new Event('schedulePublished'))
          } catch (err) {
            console.error('Error fetching published shifts:', err);
            await Swal.fire({
              icon: 'success',
              title: 'Schedule Published!',
              html: `<div class="text-left">
                <p class="mb-2">Your schedule has been published successfully!</p>
                <p class="text-sm text-gray-600"><strong>${data.shiftsCreated}</strong> shifts have been added to the system.</p>
                <p class="text-xs text-gray-500 mt-2">Refresh the page to see the updates reflected across the system.</p>
              </div>`,
              confirmButtonColor: '#3b82f6'
            })
          }
        } else {
          await Swal.fire({
            icon: 'error',
            title: 'Publishing Failed',
            text: data.error || 'Failed to publish schedule. Please try again.',
            confirmButtonColor: '#3b82f6'
          })
        }
      } catch (err) {
        console.error('Error publishing schedule:', err)
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while publishing the schedule. Please try again.',
          confirmButtonColor: '#3b82f6'
        })
      } finally {
        setPublishing(false)
      }
    }
  }

  const handleClearSchedule = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Clear Schedule?',
      text: `This will remove all ${assignedShifts} assignments from the calendar. This does not affect already published shifts in the database.`,
      showCancelButton: true,
      confirmButtonText: 'Clear Schedule',
      cancelButtonText: 'Keep It',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    })

    if (result.isConfirmed) {
      setAssignments({})
      await Swal.fire({
        icon: 'success',
        title: 'Schedule Cleared',
        text: 'All assignments have been cleared. You can now plan for the next period.',
        confirmButtonColor: '#3b82f6'
      })
    }
  }

  const departments = ['All Departments', 'Cardiology', 'Emergency', 'Surgery', 'Anesthesiology', 'Pediatrics', 'Neurology', 'Radiology', 'Oncology']
  const shifts = ['Morning Shift', 'Afternoon Shift', 'Evening Shift']
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Filter staff by selected department
  const filteredStaff = selectedDepartment === 'All Departments'
    ? availableStaff
    : availableStaff.filter(staff => staff.department === selectedDepartment)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  // Get calendar data
  const getShiftCountForStaff = (staffId: string): number => {
    let count = 0

    for (const [key, assignmentList] of Object.entries(assignments)) {
      const parsed = parseAssignmentKey(key)
      if (!parsed) {
        continue
      }

      if (parsed.year !== year || parsed.month !== month + 1) {
        continue
      }

      count += assignmentList.filter(a => a.staffId === staffId).length
    }

    return count
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const handleSelectMonthYear = (selectedMonth: number, selectedYear: number) => {
    setCurrentDate(new Date(selectedYear, selectedMonth, 1))
    setSelectedDay(null)
    setShowDatePicker(false)
  }

  const handleDragStart = (staff: Staff) => {
    setDraggedStaff(staff)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (day: number, shiftType: string) => {
    if (draggedStaff) {
      const key = getAssignmentKey(year, month + 1, day, shiftType)
      console.log('Dropping staff:', draggedStaff.name, 'to', key);
      
      const newAssignment = {
        staffId: draggedStaff.id,
        staffName: draggedStaff.name,
        department: draggedStaff.department
      }

      setAssignments(prevAssignments => {
        const normalizedPrevAssignments = normalizeAssignmentMap(prevAssignments)
        const existingAssignments = normalizedPrevAssignments[key] || []
        const alreadyAssigned = existingAssignments.some(a => a.staffId === draggedStaff.id)

        if (alreadyAssigned) {
          return normalizedPrevAssignments
        }

        return normalizeAssignmentMap({
          ...normalizedPrevAssignments,
          [key]: [...existingAssignments, newAssignment]
        })
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

  const getAssignmentsForDay = (day: number) => {
    const count = Object.entries(assignments).reduce((total, [key, assignmentList]) => {
      const parsed = parseAssignmentKey(key)

      if (!parsed) {
        return total
      }

      if (parsed.year !== year || parsed.month !== month + 1 || parsed.day !== day) {
        return total
      }

      return total + assignmentList.length
    }, 0)

    return count
  }

  const totalShifts = 147
  const assignedShifts = Object.values(assignments).reduce((sum, arr) => sum + arr.length, 0)
  const unassignedShifts = totalShifts - assignedShifts
  const coverage = Math.round((assignedShifts / totalShifts) * 100)

  return (
    <div className="p-8">
      {/* Overlay for date picker */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowDatePicker(false)}
        ></div>
      )}

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
          {assignedShifts > 0 && (
            <button 
              onClick={handleClearSchedule}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 shadow-sm hover:shadow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3H4v2h16V7h-3z" />
              </svg>
              <span className="font-medium">Clear Schedule</span>
            </button>
          )}
          <button 
            onClick={handlePublishSchedule}
            disabled={publishing}
            className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all duration-200 shadow-sm ${
              publishing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-md'
            }`}
          >
            {publishing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">Publishing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="font-medium">Publish Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Month/Year Navigation */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex items-center justify-between relative">
        <button 
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="flex items-center gap-2 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-semibold text-lg">{monthName} {year}</span>
        </button>
        <button 
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Date Picker Dropdown */}
        {showDatePicker && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-6 z-50 w-96">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Year</h4>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((yearOption) => (
                  <button
                    key={yearOption}
                    onClick={() => handleSelectMonthYear(month, yearOption)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      yearOption === year
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {yearOption}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Month</h4>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => i).map((monthOption) => {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  return (
                    <button
                      key={monthOption}
                      onClick={() => handleSelectMonthYear(monthOption, year)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        monthOption === month
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      {monthNames[monthOption]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Available Staff Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Available Staff</h3>
              {selectedDepartment !== 'All Departments' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {selectedDepartment}
                </span>
              )}
            </div>
            
            {/* Loading State */}
            {loading ? (
              <div className="text-center py-4">
                <div className="text-gray-500">Loading staff...</div>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <div className="text-red-500 text-sm">{error}</div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500 text-sm">No staff available for {selectedDepartment}</div>
                  </div>
                ) : (
                  filteredStaff.map((staff) => {
                    const shiftCount = getShiftCountForStaff(staff.id)
                    return (
                      <div
                        key={staff.id}
                        draggable
                        onDragStart={() => handleDragStart(staff)}
                        className={`p-3 rounded-lg cursor-move hover:shadow-md transition-all duration-200 border ${
                          shiftCount > 0
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-800">{staff.name}</p>
                          {shiftCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-600 text-white">
                              {shiftCount} {shiftCount === 1 ? 'shift' : 'shifts'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600">{staff.department}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {staff.role}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Calendar View */}
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

            {/* Calendar Grid */}
            <div>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before the first day of month */}
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded-lg"></div>
                ))}

                {/* Calendar days */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1
                  const assignmentCount = getAssignmentsForDay(day)
                  const isSelected = selectedDay === day
                  
                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`h-24 border-2 rounded-lg cursor-pointer transition-all duration-200 p-2 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-700">{day}</div>
                      {assignmentCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {assignmentCount} assigned
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Selected Day Shifts Panel */}
            {selectedDay && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {monthName} {selectedDay}, {year} - Shift Assignments
                </h3>
                <div className="space-y-6">
                  {shifts.map((shift) => {
                    const key = getAssignmentKey(year, month + 1, selectedDay, shift)
                    const assignmentList = assignments[key] || []
                    
                    return (
                      <div key={shift}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <h4 className="text-base font-semibold text-gray-800">{shift}</h4>
                        </div>
                        
                        <div
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(selectedDay, shift)}
                          className={`min-h-20 border-2 border-dashed rounded-lg transition-all duration-200 p-3 ${
                            assignmentList.length > 0
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {assignmentList.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {assignmentList.map((assignment) => (
                                <div 
                                  key={assignment.staffId} 
                                  className={`relative group rounded-lg px-3 py-2 border flex items-center gap-2 ${
                                    assignment.isPublished
                                      ? 'bg-blue-50 border-blue-300'
                                      : 'bg-white border-green-200'
                                  }`}
                                >
                                  <div className={`text-sm font-medium ${
                                    assignment.isPublished ? 'text-blue-900' : 'text-gray-800'
                                  }`}>
                                    {assignment.staffName}
                                  </div>
                                  {assignment.isPublished && (
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" title="Published"></span>
                                  )}
                                  <button
                                    onClick={() => handleRemoveAssignment(key, assignment.staffId)}
                                    className="p-1 bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-100"
                                  >
                                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-14 flex items-center justify-center text-gray-400 text-sm">
                              Drag staff here to assign to this shift
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
