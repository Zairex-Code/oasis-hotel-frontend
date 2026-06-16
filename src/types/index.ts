//=================================================================
//1. ENUMS (Mapped exactly from the java Enum class)
//==============================================================

export enum Role{
    CUSTOMER = "CUSTOMER",
    HOTEL_MANAGER = "HOTEL_MANAGER",
    ADMIN = "ADMIN",
}

export enum HotelStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
}

export enum RoomStatus {
    AVAILABLE = "AVAILABLE",
    MAINTENANCE = "MAINTENANCE",
    OCCUPIED = "OCCUPIED",
    OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

export enum RoomType{
    SINGLE = "SINGLE",
    DOUBLE = "DOUBLE",
    SUITE = "SUITE",
    MATRIMONIAL = "MATRIMONIAL",
    PRESIDENTIAL = "PRESIDENTIAL",
}

export enum ReservationStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED",
}

// ===============================================
// 2. INTERFACES 
// ==================================================

export interface User{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role:Role;
}

export interface Hotel{
    id: number;
    name: string;
    address: string;
    city: string;
    starsRating: number;
    status: HotelStatus;
    imageUrl: string;
}


export interface Room {
    id: number;
    hotelId: number;
    roomNumber: String;
    roomType: RoomType;
    capacity: number;
    pricePerNight: number;
    roomStatus: RoomStatus;

}

// generic pagination structure that returns Spring Data JPA
export interface PageableResponse<T>{
    content: T[];
    pageable: any;
    totalElements: number;
    totalPages: number;
    last: boolean;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    empty: boolean;
}