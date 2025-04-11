import { ExcalidrawElement, NonDeletedExcalidrawElement } from "./types";

export class Scene {
    private elements: ExcalidrawElement[] = [];

    constructor() { }

    getElements(): readonly ExcalidrawElement[] {
        return this.elements;
    }

    getNonDeletedElements(): readonly NonDeletedExcalidrawElement[] {
        return this.elements.filter(
            (element) => !element.isDeleted
        ) as NonDeletedExcalidrawElement[];
    }

    replaceAllElements(nextElements: readonly ExcalidrawElement[]) {
        this.elements = nextElements.filter(element => !element.isDeleted);
    }

    addElement(element: ExcalidrawElement) {
        this.elements = [...this.elements, element];
    }

    updateElement(elementId: string, updates: Partial<ExcalidrawElement>) {
        this.elements = this.elements.map((element) => {
            if (element.id === elementId) {
                return { ...element, ...updates };
            }
            return element;
        });
    }

    deleteElement(elementId: string) {
        this.elements = this.elements.map((element) => {
            if (element.id === elementId) {
                return { ...element, isDeleted: true };
            }
            return element;
        });
    }

    getElementById(id: string): ExcalidrawElement | undefined {
        return this.elements.find((element) => element.id === id);
    }

    getElementByIdAtPosition(x: number, y: number): ExcalidrawElement | undefined {
        return this.elements.find(
            (element) =>
                x >= element.x &&
                x <= element.x + element.width &&
                y >= element.y &&
                y <= element.y + element.height
        );
    }
}