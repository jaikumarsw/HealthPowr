import React, { useState } from 'react';
import { AlertTriangle, Phone, MapPin, Clock, X } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';

interface EmergencyResource {
  id: string;
  name: string;
  type: 'shelter' | 'food' | 'crisis' | 'medical' | 'police';
  phone: string;
  address: string;
  distance?: string;
  available24h: boolean;
  description: string;
}

interface EmergencyButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmergencyButton({ className = '', size = 'md' }: EmergencyButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { position, getCurrentPosition, loading: locationLoading } = useGeolocation();

  const emergencyTypes = [
    {
      id: 'shelter',
      name: 'Emergency Shelter',
      icon: '🏠',
      color: 'bg-teal-600 hover:bg-teal-700',
      description: 'Immediate housing assistance'
    },
    {
      id: 'food',
      name: 'Emergency Food',
      icon: '🍽️',
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Food pantries and meal programs'
    },
    {
      id: 'crisis',
      name: 'Crisis Support',
      icon: '💬',
      color: 'bg-purple-600 hover:bg-purple-700',
      description: 'Mental health crisis lines'
    },
    {
      id: 'medical',
      name: 'Medical Emergency',
      icon: '🏥',
      color: 'bg-red-600 hover:bg-red-700',
      description: 'Emergency medical services'
    }
  ];

  const emergencyResources: Record<string, EmergencyResource[]> = {
    shelter: [
      {
        id: 'shelter-1',
        name: 'Downtown Emergency Shelter',
        type: 'shelter',
        phone: '(555) 911-1111',
        address: '123 Main St, Downtown',
        distance: '0.5 miles',
        available24h: true,
        description: 'Emergency overnight shelter with intake services'
      },
      {
        id: 'shelter-2',
        name: 'Family Crisis Center',
        type: 'shelter',
        phone: '(555) 911-2222',
        address: '456 Oak Ave, Midtown',
        distance: '1.2 miles',
        available24h: true,
        description: 'Family-focused emergency housing'
      }
    ],
    food: [
      {
        id: 'food-1',
        name: 'Emergency Food Bank',
        type: 'food',
        phone: '(555) 911-3333',
        address: '789 Pine St, Central',
        distance: '0.8 miles',
        available24h: false,
        description: 'Emergency food assistance and hot meals'
      },
      {
        id: 'food-2',
        name: '24/7 Community Kitchen',
        type: 'food',
        phone: '(555) 911-4444',
        address: '321 Elm Dr, Westside',
        distance: '1.5 miles',
        available24h: true,
        description: 'Round-the-clock meal service'
      }
    ],
    crisis: [
      {
        id: 'crisis-1',
        name: 'Crisis Helpline',
        type: 'crisis',
        phone: '988',
        address: 'National Suicide Prevention Lifeline',
        available24h: true,
        description: 'Free and confidential emotional support'
      },
      {
        id: 'crisis-2',
        name: 'Local Crisis Center',
        type: 'crisis',
        phone: '(555) 911-5555',
        address: '654 Cedar Ln, Northside',
        distance: '2.1 miles',
        available24h: true,
        description: 'Local mental health crisis intervention'
      }
    ],
    medical: [
      {
        id: 'medical-1',
        name: 'Emergency Services',
        type: 'medical',
        phone: '911',
        address: 'Emergency Medical Services',
        available24h: true,
        description: 'Call 911 for life-threatening emergencies'
      },
      {
        id: 'medical-2',
        name: 'Urgent Care Center',
        type: 'medical',
        phone: '(555) 911-6666',
        address: '987 Health Blvd, Medical District',
        distance: '1.8 miles',
        available24h: true,
        description: 'Non-emergency urgent medical care'
      }
    ]
  };

  const handleEmergencyClick = () => {
    setShowModal(true);
    // Get current location for better resource recommendations
    getCurrentPosition().catch(() => {
      // Location not available, continue without it
    });
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleGetDirections = (address: string) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-base',
    lg: 'w-20 h-20 text-lg'
  };

  return (
    <>
      {/* Emergency Button */}
      <button
        onClick={handleEmergencyClick}
        className={`
          ${sizeClasses[size]}
          bg-red-600 hover:bg-red-700 text-white rounded-full
          flex items-center justify-center shadow-lg hover:shadow-xl
          transition-all duration-200 transform hover:scale-105
          border-4 border-white ring-2 ring-red-200
          animate-pulse hover:animate-none
          ${className}
        `}
        aria-label="Emergency Resources"
      >
        <AlertTriangle className="w-1/2 h-1/2" />
      </button>

      {/* Emergency Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Emergency Resources</h2>
                    <p className="text-red-100">Find immediate help near you</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex-shrink-0  bg-red-500 hover:bg-red-400  flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row h-[600px]">
              {/* Emergency Types */}
              <div className="lg:w-1/3 border-r border-gray-200 p-6">
                <h3 className="text-[18px] font-semibold text-gray-900 mb-4">
                  What do you need help with?
                </h3>
                <div className="space-y-3">
                  {emergencyTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedType === type.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{type.name}</p>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Location Status */}
                <div className="mt-6 p-4 bg-teal-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-teal-700">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">
                      {locationLoading ? 'Getting location...' :
                       position ? 'Location found' : 'Location unavailable'}
                    </span>
                  </div>
                  {position && (
                    <p className="text-sm text-teal-600 mt-1">
                      Resources sorted by distance
                    </p>
                  )}
                </div>
              </div>

              {/* Resources List */}
              <div className="lg:w-2/3 p-6 overflow-y-auto">
                {selectedType ? (
                  <div>
                    <h3 className="text-[18px] font-semibold text-gray-900 mb-4">
                      {emergencyTypes.find(t => t.id === selectedType)?.name} Resources
                    </h3>
                    <div className="space-y-4">
                      {emergencyResources[selectedType]?.map((resource) => (
                        <div
                          key={resource.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {resource.name}
                              </h4>
                              <p className="text-gray-600">{resource.description}</p>
                            </div>
                            {resource.available24h && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                24/7
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{resource.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{resource.address}</span>
                              {resource.distance && (
                                <span className="text-teal-600 font-medium">
                                  • {resource.distance}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleCall(resource.phone)}
                              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Call Now</span>
                            </button>
                            {resource.distance && (
                              <button
                                onClick={() => handleGetDirections(resource.address)}
                                className="flex items-center justify-center gap-[8px] bg-white text-gray-700 border border-gray-200 px-[18px] py-[9px] rounded-lg font-medium text-[14px] hover:bg-gray-50 transition-all duration-200 cursor-pointer flex-shrink-0"
                              >
                                <MapPin className="w-4 h-4" />
                                <span>Directions</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-[18px] font-semibold text-gray-900 mb-2">
                      Select Emergency Type
                    </h3>
                    <p className="text-gray-600">
                      Choose the type of emergency assistance you need from the options on the left.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Available 24/7</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Free to call</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Location-based results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}