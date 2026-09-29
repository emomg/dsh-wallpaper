/**
 * dsh-wallpaper host half.
 *
 * The plugin contributes browser presentation only: the wallpaper layer is
 * rendered inside the web client shell, so this half exists to give Loader a
 * host-side row while the browser half ships through `exports["./client"]`.
 *
 * @module dsh-wallpaper
 */

/** Host plugin body — this package contributes browser presentation only. */
function apply() {}

export { apply }
