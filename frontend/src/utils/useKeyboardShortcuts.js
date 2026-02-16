import { useEffect, useCallback } from "react";

/**
 * Custom hook for declarative keyboard shortcut handling.
 *
 * @param {Object} shortcuts - Map of keyboard shortcuts to handlers
 *   Keys can be simple like "Escape", "Space", "1" or with modifiers like "ctrl+s", "shift+n"
 *   Handlers receive the keyboard event as an argument
 * @param {Object} options - Configuration options
 * @param {boolean} options.ignoreInputs - If true, ignores events when focus is in text inputs (default: true)
 * @param {boolean} options.enabled - If false, all shortcuts are disabled (default: true)
 *
 * @example
 * useKeyboardShortcuts({
 *   "Space": () => togglePause(),
 *   "Escape": () => closeModal(),
 *   "1": () => setTab("vitals"),
 *   "n": () => focusNotes(),
 * }, { ignoreInputs: true });
 */
function useKeyboardShortcuts(shortcuts, options = {}) {
    const { ignoreInputs = true, enabled = true } = options;

    const handleKeyDown = useCallback(
        (event) => {
            if (!enabled) return;

            // Check if focus is in an input element
            if (ignoreInputs) {
                const target = event.target;
                const tagName = target.tagName.toLowerCase();
                const isInput =
                    tagName === "input" ||
                    tagName === "textarea" ||
                    tagName === "select" ||
                    target.isContentEditable;

                if (isInput) return;
            }

            // Normalize the key
            let key = event.key;

            // Handle special keys
            if (key === " ") key = "Space";

            // Build modifier prefix
            const modifiers = [];
            if (event.ctrlKey || event.metaKey) modifiers.push("ctrl");
            if (event.altKey) modifiers.push("alt");
            if (event.shiftKey) modifiers.push("shift");

            // Try to find matching shortcut (with and without modifiers)
            const keyWithModifiers =
                modifiers.length > 0 ? `${modifiers.join("+")}+${key.toLowerCase()}` : null;
            const simpleKey = key;
            const lowerKey = key.toLowerCase();

            // Check for handler (try modifier version first, then exact key, then lowercase)
            const handler =
                (keyWithModifiers && shortcuts[keyWithModifiers]) ||
                shortcuts[simpleKey] ||
                shortcuts[lowerKey];

            if (handler && typeof handler === "function") {
                event.preventDefault();
                handler(event);
            }
        },
        [shortcuts, ignoreInputs, enabled]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown, enabled]);
}

export default useKeyboardShortcuts;
