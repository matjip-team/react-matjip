// src/types/kakao.d.ts
export {};

declare global {
  namespace kakao {
    namespace maps {
      function load(callback: () => void): void;

      class LatLng {
        constructor(lat: number, lng: number);
      }

      interface MapOptions {
        center: LatLng;
        level: number;
      }

      class Map {
        constructor(container: HTMLElement, options: MapOptions);
        panTo(latlng: LatLng): void;
        setCenter(latlng: LatLng): void;
      }

      class Marker {
        constructor(options: { map: Map; position: LatLng });
        setMap(map: Map | null): void;
        getPosition(): LatLng;
      }

      class InfoWindow {
        constructor(options: { content: string });
        open(map: Map, marker: Marker): void;
        close(): void;
      }

      namespace event {
        function addListener(
          target: unknown,
          type: string,
          handler: () => void
        ): void;
      }

      namespace services {
        class Places {
          keywordSearch(
            keyword: string,
            callback: (
              data: PlacesSearchResult,
              status: Status,
              pagination: Pagination
            ) => void
          ): void;
        }

        type Status = "OK" | "ZERO_RESULT" | "ERROR";

        interface Pagination {
          current: number;
          last: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
          nextPage(): void;
          prevPage(): void;
          gotoPage(page: number): void;
        }

        interface Place {
          id: string;
          place_name: string;
          x: string; // lng
          y: string; // lat
          address_name: string;
          road_address_name: string;
          phone: string;
          place_url: string;
          category_name: string;
        }

        type PlacesSearchResult = Place[];
      }
    }
  }

  interface Window {
    kakao: typeof kakao;
  }
}
