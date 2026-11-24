# Feature priority, category and Phase 3 capability type

Generated once from `docs/Product_Feature_List_nopCommerce_5.00.xlsx` (sheets "Priority View",
"Phase 3 Features" and "Changes for 5.00"). It carries the three fields that workbook adds on top
of `PRD_Product_Backlog_v10.xlsx`: the MoSCoW priority, the 5-way category grouping of the 24
modules, and the Phase 3 capability type. `scripts/generate-registries.mjs` reads this file, so the
registry stays a pure Node build over `/docs`.

## 1. Priority and category (434)

"Roadmap row" is the row of the workbook's "Product Features" sheet, so a feature here can be
opened in the workbook directly. The sheet repeats its header under each of the 24 module banners,
which is why the rows are not contiguous per module.

| Feature | Priority | Category | Roadmap row |
|---|---|---|---|
| PRD-ADM-001 | Must Have | Platform & Administration | 390 |
| PRD-ADM-002 | Must Have | Platform & Administration | 391 |
| PRD-ADM-003 | Must Have | Platform & Administration | 392 |
| PRD-ADM-004 | Must Have | Platform & Administration | 393 |
| PRD-ADM-005 | Must Have | Platform & Administration | 394 |
| PRD-ADM-006 | Must Have | Platform & Administration | 395 |
| PRD-ADM-007 | Must Have | Platform & Administration | 396 |
| PRD-ADM-008 | Should Have | Platform & Administration | 397 |
| PRD-ADM-009 | Must Have | Platform & Administration | 398 |
| PRD-ADM-010 | Must Have | Platform & Administration | 399 |
| PRD-ADM-011 | Must Have | Platform & Administration | 400 |
| PRD-ADM-012 | Could Have | Platform & Administration | 401 |
| PRD-AI-001 | Must Have | Channels, Reporting & AI | 464 |
| PRD-AI-002 | Could Have | Channels, Reporting & AI | 465 |
| PRD-AI-003 | Should Have | Channels, Reporting & AI | 466 |
| PRD-AI-004 | Should Have | Channels, Reporting & AI | 467 |
| PRD-AI-005 | Must Have | Channels, Reporting & AI | 468 |
| PRD-AI-006 | Must Have | Channels, Reporting & AI | 469 |
| PRD-AI-007 | Should Have | Channels, Reporting & AI | 470 |
| PRD-AI-008 | Could Have | Channels, Reporting & AI | 471 |
| PRD-AI-009 | Could Have | Channels, Reporting & AI | 472 |
| PRD-AI-010 | Must Have | Channels, Reporting & AI | 473 |
| PRD-CAT-001 | Must Have | Commerce | 92 |
| PRD-CAT-002 | Must Have | Commerce | 93 |
| PRD-CAT-003 | Must Have | Commerce | 94 |
| PRD-CAT-004 | Must Have | Commerce | 95 |
| PRD-CAT-005 | Must Have | Commerce | 96 |
| PRD-CAT-006 | Must Have | Commerce | 97 |
| PRD-CAT-007 | Could Have | Commerce | 98 |
| PRD-CAT-008 | Must Have | Commerce | 99 |
| PRD-CAT-009 | Must Have | Commerce | 100 |
| PRD-CAT-010 | Must Have | Commerce | 101 |
| PRD-CAT-011 | Should Have | Commerce | 102 |
| PRD-CAT-012 | Must Have | Commerce | 103 |
| PRD-CAT-013 | Should Have | Commerce | 104 |
| PRD-CAT-014 | Must Have | Commerce | 105 |
| PRD-CAT-015 | Should Have | Commerce | 106 |
| PRD-CAT-016 | Must Have | Commerce | 107 |
| PRD-CAT-017 | Must Have | Commerce | 108 |
| PRD-CAT-018 | Should Have | Commerce | 109 |
| PRD-CAT-019 | Must Have | Commerce | 110 |
| PRD-CAT-020 | Must Have | Commerce | 111 |
| PRD-CAT-021 | Must Have | Commerce | 112 |
| PRD-CAT-022 | Must Have | Commerce | 113 |
| PRD-CAT-023 | Must Have | Commerce | 114 |
| PRD-CAT-024 | Must Have | Commerce | 115 |
| PRD-CAT-025 | Should Have | Commerce | 116 |
| PRD-CAT-026 | Must Have | Commerce | 117 |
| PRD-CAT-027 | Must Have | Commerce | 118 |
| PRD-CAT-028 | Should Have | Commerce | 119 |
| PRD-CAT-029 | Must Have | Commerce | 120 |
| PRD-CAT-030 | Should Have | Commerce | 121 |
| PRD-CAT-031 | Must Have | Commerce | 122 |
| PRD-CAT-032 | Must Have | Commerce | 123 |
| PRD-CAT-033 | Should Have | Commerce | 124 |
| PRD-CAT-034 | Should Have | Commerce | 125 |
| PRD-CAT-035 | Could Have | Commerce | 126 |
| PRD-CAT-036 | Must Have | Commerce | 127 |
| PRD-CAT-037 | Must Have | Commerce | 128 |
| PRD-CAT-038 | Must Have | Commerce | 129 |
| PRD-CAT-039 | Should Have | Commerce | 130 |
| PRD-CAT-040 | Should Have | Commerce | 131 |
| PRD-CAT-041 | Should Have | Commerce | 132 |
| PRD-CAT-042 | Should Have | Commerce | 133 |
| PRD-CAT-043 | Must Have | Commerce | 134 |
| PRD-CHK-001 | Must Have | Commerce | 184 |
| PRD-CHK-002 | Must Have | Commerce | 185 |
| PRD-CHK-003 | Must Have | Commerce | 186 |
| PRD-CHK-004 | Must Have | Commerce | 187 |
| PRD-CHK-005 | Must Have | Commerce | 188 |
| PRD-CHK-006 | Could Have | Commerce | 189 |
| PRD-CHK-007 | Should Have | Commerce | 190 |
| PRD-CHK-008 | Must Have | Commerce | 191 |
| PRD-CHK-009 | Must Have | Commerce | 192 |
| PRD-CHK-010 | Could Have | Commerce | 193 |
| PRD-CHK-011 | Should Have | Commerce | 194 |
| PRD-CHK-012 | Should Have | Commerce | 195 |
| PRD-CHK-013 | Must Have | Commerce | 196 |
| PRD-CHK-014 | Must Have | Commerce | 197 |
| PRD-CHK-015 | Should Have | Commerce | 198 |
| PRD-CHK-016 | Should Have | Commerce | 199 |
| PRD-CHK-017 | Should Have | Commerce | 200 |
| PRD-CHK-018 | Must Have | Commerce | 201 |
| PRD-CHK-019 | Must Have | Commerce | 202 |
| PRD-CHN-001 | Must Have | Channels, Reporting & AI | 448 |
| PRD-CHN-002 | Should Have | Channels, Reporting & AI | 449 |
| PRD-CHN-003 | Should Have | Channels, Reporting & AI | 450 |
| PRD-CHN-004 | Should Have | Channels, Reporting & AI | 451 |
| PRD-CHN-005 | Must Have | Channels, Reporting & AI | 452 |
| PRD-CHN-006 | Must Have | Channels, Reporting & AI | 453 |
| PRD-CHN-007 | Must Have | Channels, Reporting & AI | 454 |
| PRD-CHN-008 | Could Have | Channels, Reporting & AI | 455 |
| PRD-CHN-009 | Must Have | Channels, Reporting & AI | 456 |
| PRD-CHN-010 | Must Have | Channels, Reporting & AI | 457 |
| PRD-CHN-011 | Should Have | Channels, Reporting & AI | 458 |
| PRD-CHN-012 | Should Have | Channels, Reporting & AI | 459 |
| PRD-CHN-013 | Must Have | Channels, Reporting & AI | 460 |
| PRD-CRM-001 | Must Have | Fulfilment & Customer Service | 340 |
| PRD-CRM-002 | Must Have | Fulfilment & Customer Service | 341 |
| PRD-CRM-003 | Must Have | Fulfilment & Customer Service | 342 |
| PRD-CRM-004 | Must Have | Fulfilment & Customer Service | 343 |
| PRD-CRM-005 | Should Have | Fulfilment & Customer Service | 344 |
| PRD-CRM-006 | Must Have | Fulfilment & Customer Service | 345 |
| PRD-CRM-007 | Should Have | Fulfilment & Customer Service | 346 |
| PRD-CRM-008 | Must Have | Fulfilment & Customer Service | 347 |
| PRD-CRM-009 | Must Have | Fulfilment & Customer Service | 348 |
| PRD-CRM-010 | Should Have | Fulfilment & Customer Service | 349 |
| PRD-CRM-011 | Must Have | Fulfilment & Customer Service | 350 |
| PRD-CRM-012 | Should Have | Fulfilment & Customer Service | 351 |
| PRD-CRM-013 | Could Have | Fulfilment & Customer Service | 352 |
| PRD-CRM-014 | Must Have | Fulfilment & Customer Service | 353 |
| PRD-CRM-015 | Should Have | Fulfilment & Customer Service | 354 |
| PRD-DOC-001 | Must Have | Platform & Administration | 405 |
| PRD-DOC-002 | Must Have | Platform & Administration | 406 |
| PRD-DOC-003 | Must Have | Platform & Administration | 407 |
| PRD-DOC-004 | Must Have | Platform & Administration | 408 |
| PRD-DOC-005 | Must Have | Platform & Administration | 409 |
| PRD-DOC-006 | Should Have | Platform & Administration | 410 |
| PRD-EGV-001 | Must Have | Vertical Packs | 485 |
| PRD-EGV-002 | Must Have | Vertical Packs | 486 |
| PRD-EGV-003 | Could Have | Vertical Packs | 487 |
| PRD-EGV-004 | Must Have | Vertical Packs | 488 |
| PRD-EGV-005 | Must Have | Vertical Packs | 489 |
| PRD-EGV-006 | Should Have | Vertical Packs | 490 |
| PRD-EGV-007 | Should Have | Vertical Packs | 491 |
| PRD-FIN-001 | Must Have | Vertical Packs | 477 |
| PRD-FIN-002 | Should Have | Vertical Packs | 478 |
| PRD-FIN-003 | Must Have | Vertical Packs | 479 |
| PRD-FIN-004 | Must Have | Vertical Packs | 480 |
| PRD-FIN-005 | Could Have | Vertical Packs | 481 |
| PRD-IAM-001 | Must Have | Platform & Administration | 34 |
| PRD-IAM-002 | Must Have | Platform & Administration | 35 |
| PRD-IAM-003 | Must Have | Platform & Administration | 36 |
| PRD-IAM-004 | Must Have | Platform & Administration | 37 |
| PRD-IAM-005 | Must Have | Platform & Administration | 38 |
| PRD-IAM-006 | Must Have | Platform & Administration | 39 |
| PRD-IAM-007 | Must Have | Platform & Administration | 40 |
| PRD-IAM-008 | Must Have | Platform & Administration | 41 |
| PRD-IAM-009 | Should Have | Platform & Administration | 42 |
| PRD-IAM-010 | Must Have | Platform & Administration | 43 |
| PRD-IAM-011 | Must Have | Platform & Administration | 44 |
| PRD-IAM-012 | Must Have | Platform & Administration | 45 |
| PRD-IAM-013 | Should Have | Platform & Administration | 46 |
| PRD-IAM-014 | Must Have | Platform & Administration | 47 |
| PRD-IAM-015 | Must Have | Platform & Administration | 48 |
| PRD-IAM-016 | Must Have | Platform & Administration | 49 |
| PRD-IAM-017 | Must Have | Platform & Administration | 50 |
| PRD-IAM-018 | Must Have | Platform & Administration | 51 |
| PRD-IAM-019 | Must Have | Platform & Administration | 52 |
| PRD-IAM-020 | Must Have | Platform & Administration | 53 |
| PRD-IAM-021 | Must Have | Platform & Administration | 54 |
| PRD-IAM-022 | Must Have | Platform & Administration | 55 |
| PRD-IAM-023 | Must Have | Platform & Administration | 56 |
| PRD-IAM-024 | Must Have | Platform & Administration | 57 |
| PRD-IAM-025 | Must Have | Platform & Administration | 58 |
| PRD-IAM-026 | Must Have | Platform & Administration | 59 |
| PRD-IAM-027 | Should Have | Platform & Administration | 60 |
| PRD-INT-001 | Must Have | Platform & Administration | 432 |
| PRD-INT-002 | Must Have | Platform & Administration | 433 |
| PRD-INT-003 | Must Have | Platform & Administration | 434 |
| PRD-INT-004 | Must Have | Platform & Administration | 435 |
| PRD-INT-005 | Must Have | Platform & Administration | 436 |
| PRD-INT-006 | Must Have | Platform & Administration | 437 |
| PRD-INT-007 | Must Have | Platform & Administration | 438 |
| PRD-INT-008 | Must Have | Platform & Administration | 439 |
| PRD-INT-009 | Should Have | Platform & Administration | 440 |
| PRD-INT-010 | Should Have | Platform & Administration | 441 |
| PRD-INT-011 | Must Have | Platform & Administration | 442 |
| PRD-INT-012 | Should Have | Platform & Administration | 443 |
| PRD-INT-013 | Could Have | Platform & Administration | 444 |
| PRD-INV-001 | Must Have | Commerce | 138 |
| PRD-INV-002 | Must Have | Commerce | 139 |
| PRD-INV-003 | Must Have | Commerce | 140 |
| PRD-INV-004 | Must Have | Commerce | 141 |
| PRD-INV-005 | Must Have | Commerce | 142 |
| PRD-INV-006 | Must Have | Commerce | 143 |
| PRD-INV-007 | Should Have | Commerce | 144 |
| PRD-INV-008 | Should Have | Commerce | 145 |
| PRD-INV-009 | Must Have | Commerce | 146 |
| PRD-INV-010 | Should Have | Commerce | 147 |
| PRD-INV-011 | Must Have | Commerce | 148 |
| PRD-INV-012 | Must Have | Commerce | 149 |
| PRD-INV-013 | Must Have | Commerce | 150 |
| PRD-LOG-001 | Must Have | Fulfilment & Customer Service | 276 |
| PRD-LOG-002 | Must Have | Fulfilment & Customer Service | 277 |
| PRD-LOG-003 | Should Have | Fulfilment & Customer Service | 278 |
| PRD-LOG-004 | Must Have | Fulfilment & Customer Service | 279 |
| PRD-LOG-005 | Must Have | Fulfilment & Customer Service | 280 |
| PRD-LOG-006 | Must Have | Fulfilment & Customer Service | 281 |
| PRD-LOG-007 | Must Have | Fulfilment & Customer Service | 282 |
| PRD-LOG-008 | Must Have | Fulfilment & Customer Service | 283 |
| PRD-LOG-009 | Must Have | Fulfilment & Customer Service | 284 |
| PRD-LOG-010 | Must Have | Fulfilment & Customer Service | 285 |
| PRD-LOG-011 | Must Have | Fulfilment & Customer Service | 286 |
| PRD-LOG-012 | Must Have | Fulfilment & Customer Service | 287 |
| PRD-LOG-013 | Must Have | Fulfilment & Customer Service | 288 |
| PRD-LOG-014 | Should Have | Fulfilment & Customer Service | 289 |
| PRD-LOG-015 | Could Have | Fulfilment & Customer Service | 290 |
| PRD-LOG-016 | Could Have | Fulfilment & Customer Service | 291 |
| PRD-LOG-017 | Could Have | Fulfilment & Customer Service | 292 |
| PRD-LOG-018 | Should Have | Fulfilment & Customer Service | 293 |
| PRD-LOG-019 | Should Have | Fulfilment & Customer Service | 294 |
| PRD-LOG-020 | Should Have | Fulfilment & Customer Service | 295 |
| PRD-LOG-021 | Must Have | Fulfilment & Customer Service | 296 |
| PRD-LOG-022 | Must Have | Fulfilment & Customer Service | 297 |
| PRD-LOG-023 | Must Have | Fulfilment & Customer Service | 298 |
| PRD-LOG-024 | Should Have | Fulfilment & Customer Service | 299 |
| PRD-LOG-025 | Must Have | Fulfilment & Customer Service | 300 |
| PRD-LOG-026 | Must Have | Fulfilment & Customer Service | 301 |
| PRD-LOG-027 | Must Have | Fulfilment & Customer Service | 302 |
| PRD-LOG-028 | Must Have | Fulfilment & Customer Service | 303 |
| PRD-LOG-029 | Must Have | Fulfilment & Customer Service | 304 |
| PRD-LOG-030 | Must Have | Fulfilment & Customer Service | 305 |
| PRD-LOG-031 | Should Have | Fulfilment & Customer Service | 306 |
| PRD-LOG-032 | Must Have | Fulfilment & Customer Service | 307 |
| PRD-MKT-001 | Must Have | Commerce | 358 |
| PRD-MKT-002 | Must Have | Commerce | 359 |
| PRD-MKT-003 | Must Have | Commerce | 360 |
| PRD-MKT-004 | Should Have | Commerce | 361 |
| PRD-MKT-005 | Must Have | Commerce | 362 |
| PRD-MKT-006 | Must Have | Commerce | 363 |
| PRD-MKT-007 | Must Have | Commerce | 364 |
| PRD-MKT-008 | Must Have | Commerce | 365 |
| PRD-MKT-009 | Must Have | Commerce | 366 |
| PRD-MKT-010 | Must Have | Commerce | 367 |
| PRD-MKT-011 | Could Have | Commerce | 368 |
| PRD-MKT-012 | Should Have | Commerce | 369 |
| PRD-MKT-013 | Should Have | Commerce | 370 |
| PRD-MKT-014 | Must Have | Commerce | 371 |
| PRD-ORD-001 | Must Have | Commerce | 245 |
| PRD-ORD-002 | Must Have | Commerce | 246 |
| PRD-ORD-003 | Must Have | Commerce | 247 |
| PRD-ORD-004 | Should Have | Commerce | 248 |
| PRD-ORD-005 | Must Have | Commerce | 249 |
| PRD-ORD-006 | Could Have | Commerce | 250 |
| PRD-ORD-007 | Could Have | Commerce | 251 |
| PRD-ORD-008 | Could Have | Commerce | 252 |
| PRD-ORD-009 | Must Have | Commerce | 253 |
| PRD-ORD-010 | Should Have | Commerce | 254 |
| PRD-ORD-011 | Should Have | Commerce | 255 |
| PRD-ORD-012 | Must Have | Commerce | 256 |
| PRD-ORD-013 | Must Have | Commerce | 257 |
| PRD-ORD-014 | Must Have | Commerce | 258 |
| PRD-ORD-015 | Must Have | Commerce | 259 |
| PRD-ORD-016 | Must Have | Commerce | 260 |
| PRD-ORD-017 | Must Have | Commerce | 261 |
| PRD-ORD-018 | Must Have | Commerce | 262 |
| PRD-ORD-019 | Must Have | Commerce | 263 |
| PRD-ORD-020 | Must Have | Commerce | 264 |
| PRD-ORD-021 | Must Have | Commerce | 265 |
| PRD-ORD-022 | Must Have | Commerce | 266 |
| PRD-ORD-023 | Must Have | Commerce | 267 |
| PRD-ORD-024 | Must Have | Commerce | 268 |
| PRD-ORD-025 | Should Have | Commerce | 269 |
| PRD-ORD-026 | Should Have | Commerce | 270 |
| PRD-ORD-027 | Should Have | Commerce | 271 |
| PRD-ORD-028 | Should Have | Commerce | 272 |
| PRD-PAY-001 | Must Have | Commerce | 206 |
| PRD-PAY-002 | Must Have | Commerce | 207 |
| PRD-PAY-003 | Must Have | Commerce | 208 |
| PRD-PAY-004 | Must Have | Commerce | 209 |
| PRD-PAY-005 | Must Have | Commerce | 210 |
| PRD-PAY-006 | Must Have | Commerce | 211 |
| PRD-PAY-007 | Must Have | Commerce | 212 |
| PRD-PAY-008 | Must Have | Commerce | 213 |
| PRD-PAY-009 | Could Have | Commerce | 214 |
| PRD-PAY-010 | Must Have | Commerce | 215 |
| PRD-PAY-011 | Must Have | Commerce | 216 |
| PRD-PAY-012 | Must Have | Commerce | 217 |
| PRD-PAY-013 | Must Have | Commerce | 218 |
| PRD-PAY-014 | Must Have | Commerce | 219 |
| PRD-PAY-015 | Should Have | Commerce | 220 |
| PRD-PAY-016 | Must Have | Commerce | 221 |
| PRD-PAY-017 | Could Have | Commerce | 222 |
| PRD-PAY-018 | Should Have | Commerce | 223 |
| PRD-PAY-019 | Must Have | Commerce | 224 |
| PRD-PAY-020 | Must Have | Commerce | 225 |
| PRD-PAY-021 | Must Have | Commerce | 226 |
| PRD-PAY-022 | Must Have | Commerce | 227 |
| PRD-PAY-023 | Must Have | Commerce | 228 |
| PRD-PAY-024 | Must Have | Commerce | 229 |
| PRD-PAY-025 | Should Have | Commerce | 230 |
| PRD-PAY-026 | Should Have | Commerce | 231 |
| PRD-PAY-027 | Should Have | Commerce | 232 |
| PRD-PAY-028 | Must Have | Commerce | 233 |
| PRD-PAY-029 | Must Have | Commerce | 234 |
| PRD-PAY-030 | Must Have | Commerce | 235 |
| PRD-PAY-031 | Must Have | Commerce | 236 |
| PRD-PAY-032 | Should Have | Commerce | 237 |
| PRD-PAY-033 | Should Have | Commerce | 238 |
| PRD-PAY-034 | Should Have | Commerce | 239 |
| PRD-PAY-035 | Should Have | Commerce | 240 |
| PRD-PAY-036 | Should Have | Commerce | 241 |
| PRD-PLT-001 | Must Have | Platform & Administration | 4 |
| PRD-PLT-002 | Must Have | Platform & Administration | 5 |
| PRD-PLT-003 | Must Have | Platform & Administration | 6 |
| PRD-PLT-004 | Must Have | Platform & Administration | 7 |
| PRD-PLT-005 | Must Have | Platform & Administration | 8 |
| PRD-PLT-006 | Must Have | Platform & Administration | 9 |
| PRD-PLT-007 | Must Have | Platform & Administration | 10 |
| PRD-PLT-008 | Must Have | Platform & Administration | 11 |
| PRD-PLT-009 | Must Have | Platform & Administration | 12 |
| PRD-PLT-010 | Must Have | Platform & Administration | 13 |
| PRD-PLT-011 | Must Have | Platform & Administration | 14 |
| PRD-PLT-012 | Must Have | Platform & Administration | 15 |
| PRD-PLT-013 | Must Have | Platform & Administration | 16 |
| PRD-PLT-014 | Should Have | Platform & Administration | 17 |
| PRD-PLT-015 | Must Have | Platform & Administration | 18 |
| PRD-PLT-016 | Must Have | Platform & Administration | 19 |
| PRD-PLT-017 | Must Have | Platform & Administration | 20 |
| PRD-PLT-018 | Must Have | Platform & Administration | 21 |
| PRD-PLT-019 | Should Have | Platform & Administration | 22 |
| PRD-PLT-020 | Must Have | Platform & Administration | 23 |
| PRD-PLT-021 | Should Have | Platform & Administration | 24 |
| PRD-PLT-022 | Should Have | Platform & Administration | 25 |
| PRD-PLT-023 | Should Have | Platform & Administration | 26 |
| PRD-PLT-024 | Must Have | Platform & Administration | 27 |
| PRD-PLT-025 | Must Have | Platform & Administration | 28 |
| PRD-PLT-026 | Must Have | Platform & Administration | 29 |
| PRD-PLT-027 | Must Have | Platform & Administration | 30 |
| PRD-RET-001 | Must Have | Fulfilment & Customer Service | 326 |
| PRD-RET-002 | Must Have | Fulfilment & Customer Service | 327 |
| PRD-RET-003 | Must Have | Fulfilment & Customer Service | 328 |
| PRD-RET-004 | Must Have | Fulfilment & Customer Service | 329 |
| PRD-RET-005 | Must Have | Fulfilment & Customer Service | 330 |
| PRD-RET-006 | Could Have | Fulfilment & Customer Service | 331 |
| PRD-RET-007 | Must Have | Fulfilment & Customer Service | 332 |
| PRD-RET-008 | Must Have | Fulfilment & Customer Service | 333 |
| PRD-RET-009 | Should Have | Fulfilment & Customer Service | 334 |
| PRD-RET-010 | Should Have | Fulfilment & Customer Service | 335 |
| PRD-RET-011 | Must Have | Fulfilment & Customer Service | 336 |
| PRD-RPT-001 | Must Have | Channels, Reporting & AI | 375 |
| PRD-RPT-002 | Must Have | Channels, Reporting & AI | 376 |
| PRD-RPT-003 | Must Have | Channels, Reporting & AI | 377 |
| PRD-RPT-004 | Must Have | Channels, Reporting & AI | 378 |
| PRD-RPT-005 | Must Have | Channels, Reporting & AI | 379 |
| PRD-RPT-006 | Must Have | Channels, Reporting & AI | 380 |
| PRD-RPT-007 | Should Have | Channels, Reporting & AI | 381 |
| PRD-RPT-008 | Must Have | Channels, Reporting & AI | 382 |
| PRD-RPT-009 | Must Have | Channels, Reporting & AI | 383 |
| PRD-RPT-010 | Must Have | Channels, Reporting & AI | 384 |
| PRD-RPT-011 | Must Have | Channels, Reporting & AI | 385 |
| PRD-RPT-012 | Must Have | Channels, Reporting & AI | 386 |
| PRD-SEC-001 | Must Have | Platform & Administration | 414 |
| PRD-SEC-002 | Must Have | Platform & Administration | 415 |
| PRD-SEC-003 | Must Have | Platform & Administration | 416 |
| PRD-SEC-004 | Must Have | Platform & Administration | 417 |
| PRD-SEC-005 | Must Have | Platform & Administration | 418 |
| PRD-SEC-006 | Must Have | Platform & Administration | 419 |
| PRD-SEC-007 | Must Have | Platform & Administration | 420 |
| PRD-SEC-008 | Should Have | Platform & Administration | 421 |
| PRD-SEC-009 | Must Have | Platform & Administration | 422 |
| PRD-SEC-010 | Must Have | Platform & Administration | 423 |
| PRD-SEC-011 | Must Have | Platform & Administration | 424 |
| PRD-SEC-012 | Must Have | Platform & Administration | 425 |
| PRD-SEC-013 | Should Have | Platform & Administration | 426 |
| PRD-SEC-014 | Must Have | Platform & Administration | 427 |
| PRD-SEC-015 | Must Have | Platform & Administration | 428 |
| PRD-SEL-001 | Must Have | Commerce | 64 |
| PRD-SEL-002 | Must Have | Commerce | 65 |
| PRD-SEL-003 | Must Have | Commerce | 66 |
| PRD-SEL-004 | Must Have | Commerce | 67 |
| PRD-SEL-005 | Must Have | Commerce | 68 |
| PRD-SEL-006 | Must Have | Commerce | 69 |
| PRD-SEL-007 | Must Have | Commerce | 70 |
| PRD-SEL-008 | Should Have | Commerce | 71 |
| PRD-SEL-009 | Could Have | Commerce | 72 |
| PRD-SEL-010 | Must Have | Commerce | 73 |
| PRD-SEL-011 | Should Have | Commerce | 74 |
| PRD-SEL-012 | Should Have | Commerce | 75 |
| PRD-SEL-013 | Must Have | Commerce | 76 |
| PRD-SEL-014 | Must Have | Commerce | 77 |
| PRD-SEL-015 | Must Have | Commerce | 78 |
| PRD-SEL-016 | Must Have | Commerce | 79 |
| PRD-SEL-017 | Must Have | Commerce | 80 |
| PRD-SEL-018 | Should Have | Commerce | 81 |
| PRD-SEL-019 | Could Have | Commerce | 82 |
| PRD-SEL-020 | Must Have | Commerce | 83 |
| PRD-SEL-021 | Should Have | Commerce | 84 |
| PRD-SEL-022 | Could Have | Commerce | 85 |
| PRD-SEL-023 | Could Have | Commerce | 86 |
| PRD-SEL-024 | Must Have | Commerce | 87 |
| PRD-SEL-025 | Should Have | Commerce | 88 |
| PRD-SRC-001 | Must Have | Commerce | 154 |
| PRD-SRC-002 | Must Have | Commerce | 155 |
| PRD-SRC-003 | Must Have | Commerce | 156 |
| PRD-SRC-004 | Must Have | Commerce | 157 |
| PRD-SRC-005 | Should Have | Commerce | 158 |
| PRD-SRC-006 | Must Have | Commerce | 159 |
| PRD-SRC-007 | Must Have | Commerce | 160 |
| PRD-SRC-008 | Could Have | Commerce | 161 |
| PRD-SRC-009 | Should Have | Commerce | 162 |
| PRD-SRC-010 | Should Have | Commerce | 163 |
| PRD-SRC-011 | Must Have | Commerce | 164 |
| PRD-SRC-012 | Must Have | Commerce | 165 |
| PRD-SRC-013 | Must Have | Commerce | 166 |
| PRD-SRC-014 | Must Have | Commerce | 167 |
| PRD-SRC-015 | Should Have | Commerce | 168 |
| PRD-SRC-016 | Must Have | Commerce | 169 |
| PRD-SRC-017 | Should Have | Commerce | 170 |
| PRD-SRC-018 | Must Have | Commerce | 171 |
| PRD-SRC-019 | Must Have | Commerce | 172 |
| PRD-SRC-020 | Should Have | Commerce | 173 |
| PRD-SRC-021 | Must Have | Commerce | 174 |
| PRD-SRC-022 | Should Have | Commerce | 175 |
| PRD-SRC-023 | Should Have | Commerce | 176 |
| PRD-SRC-024 | Could Have | Commerce | 177 |
| PRD-SRC-025 | Must Have | Commerce | 178 |
| PRD-SRC-026 | Must Have | Commerce | 179 |
| PRD-SRC-027 | Should Have | Commerce | 180 |
| PRD-SVC-001 | Must Have | Commerce | 495 |
| PRD-SVC-002 | Must Have | Commerce | 496 |
| PRD-SVC-003 | Should Have | Commerce | 497 |
| PRD-SVC-004 | Should Have | Commerce | 498 |
| PRD-SVC-005 | Must Have | Commerce | 499 |
| PRD-SVC-006 | Should Have | Commerce | 500 |
| PRD-SVC-007 | Should Have | Commerce | 501 |
| PRD-SVC-008 | Must Have | Commerce | 502 |
| PRD-SVC-009 | Could Have | Commerce | 503 |
| PRD-SVC-010 | Should Have | Commerce | 504 |
| PRD-SVC-011 | Should Have | Commerce | 505 |
| PRD-SVC-012 | Should Have | Commerce | 506 |
| PRD-TRK-001 | Must Have | Fulfilment & Customer Service | 311 |
| PRD-TRK-002 | Should Have | Fulfilment & Customer Service | 312 |
| PRD-TRK-003 | Must Have | Fulfilment & Customer Service | 313 |
| PRD-TRK-004 | Must Have | Fulfilment & Customer Service | 314 |
| PRD-TRK-005 | Must Have | Fulfilment & Customer Service | 315 |
| PRD-TRK-006 | Must Have | Fulfilment & Customer Service | 316 |
| PRD-TRK-007 | Must Have | Fulfilment & Customer Service | 317 |
| PRD-TRK-008 | Must Have | Fulfilment & Customer Service | 318 |
| PRD-TRK-009 | Could Have | Fulfilment & Customer Service | 319 |
| PRD-TRK-010 | Must Have | Fulfilment & Customer Service | 320 |
| PRD-TRK-011 | Must Have | Fulfilment & Customer Service | 321 |
| PRD-TRK-012 | Must Have | Fulfilment & Customer Service | 322 |

## 2. Phase 3 capability type (21)

| Feature | Capability type |
|---|---|
| PRD-ADM-012 | Best-in-class / specialised |
| PRD-AI-001 | AI pack |
| PRD-AI-002 | AI pack |
| PRD-AI-004 | AI pack |
| PRD-AI-006 | AI pack |
| PRD-AI-007 | AI pack |
| PRD-AI-008 | AI pack |
| PRD-AI-009 | AI pack |
| PRD-CHN-008 | Best-in-class / specialised |
| PRD-CRM-013 | Best-in-class / specialised |
| PRD-FIN-001 | Agri-finance and schemes pack |
| PRD-FIN-002 | Agri-finance and schemes pack |
| PRD-FIN-003 | Agri-finance and schemes pack |
| PRD-FIN-004 | Agri-finance and schemes pack |
| PRD-INT-012 | Best-in-class / specialised |
| PRD-LOG-019 | Best-in-class / specialised |
| PRD-ORD-021 | Best-in-class / specialised |
| PRD-ORD-024 | Agri-finance and schemes pack |
| PRD-PAY-022 | Agri-finance and schemes pack |
| PRD-RPT-007 | Best-in-class / specialised |
| PRD-SEL-022 | Best-in-class / specialised |

## 3. Changes from the 4.90 edition (52 rows)

| Feature | Name | Field | Old value (4.90) | New value (5.00) | Reason |
|---|---|---|---|---|---|
| PRD-CAT-002 | Product master record | Implementation | Reusable — configuration | Code-level modification | Correction from the later 4.90 reviews, re-verified on 5.00.1. Category unchanged. No change: no relevant 5.00.1 addition found; the 4.90.8 evidence still exists in 5.00.1 source. |
| PRD-CAT-039 | Customer and company price lists | Implementation | Code-level modification | Reusable — configuration | nopCommerce 5.00.1 native capability. Category changed: CHANGED: customer/role price lists with validity dates and manual contract prices that override the standard price are now native in 5.00 (were a custom build in 4.90). |
| PRD-IAM-010 | User administration console | Implementation | Reusable — configuration | Code-level modification | Correction from the later 4.90 reviews, re-verified on 5.00.1. Category unchanged. No change: no relevant 5.00.1 addition found; the 4.90.8 evidence still exists in 5.00.1 source. |
| PRD-INT-012 | Punch-out | Implementation | Code-level modification | Reusable — configuration | nopCommerce 5.00.1 native capability. Category changed: Changed: 5.00 bundles a working cXML punch-out plugin (session handling and cart return), which was the 4.90 build scope. |
| PRD-MKT-011 | Customer segmentation attributes | Implementation | Reusable — configuration | Code-level modification | Correction from the later 4.90 reviews, re-verified on 5.00.1. Category unchanged. Category unchanged. No 5.00 addition affecting this feature found in 5.00.1 source. |
| PRD-RPT-001 | Standard reports and dashboard | Implementation | Reusable — configuration | Code-level modification | Correction from the later 4.90 reviews, re-verified on 5.00.1. Category unchanged. Category unchanged. |
| PRD-SRC-001 | Keyword search | Implementation | Code-level modification | Reusable — configuration | nopCommerce 5.00.1 native capability. Category changed: Changed: the 4.90 gap (natural-language search needs a custom ISearchProvider) is covered in 5.00 by the bundled Google AI Commerce Search plugin, which hooks keyword search natively. Conditional on Google Cloud account, GA plugin and acceptance testing; reverts to Code-level modification if the client rejects Google Cloud. |
| PRD-SRC-012 | Search history | Implementation | Code-level modification | Reusable — configuration | nopCommerce 5.00.1 native capability. Category changed: Changed: 4.90 had store-wide search-term statistics only; 5.00 adds per-customer search history with repeat from the search box, which was the whole 4.90 gap. |
| PRD-AI-005 | OCR and ID document checks | Phase | P3 | P2 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-AI-010 | AI governance | Phase | P3 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-CAT-013 | Call-for-price / negotiable flag | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-CAT-027 | Service booking | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-CAT-035 | Listing syndication and product feeds | Phase | P3 | P2 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-CRM-009 | Contact and messaging | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-IAM-011 | Staff invitation and access reviews | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-INT-012 | Punch-out | Phase | P2 | P3 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-INV-004 | Stock reservation and hold | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-ORD-021 | Performance securities | Phase | P2 | P3 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-PAY-026 | KRA eTIMS adapter | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-PAY-027 | MRA EIS adapter | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-PLT-002 | Client data isolation | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-PLT-007 | Custom domain and SSL | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-PLT-008 | Email sender identity | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-PLT-018 | Accessibility | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-RPT-007 | Public transparency dashboard | Phase | P2 | P3 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-SEC-006 | Data residency | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-SEC-008 | Breach notification workflow | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-SEC-011 | Vulnerability management | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-SEC-013 | Bot protection | Phase | P2 | P1 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-SVC-009 | Service vouchers and e-tickets | Phase | P1 | P2 | Phase placement correction applied in the current baseline (v10); listed as pending in the old Overview note A49 |
| PRD-CAT-031 | Product page delivery promise | Description | The product page shows how long delivery will take, who sells it, delivery options and a returns summary. | The product page shows how long delivery will take, who sells it, delivery options and a returns summary. The page also explains how disputes are resolved, and the same explanation appears on the order page; the returns-policy summary also appears on the order page. | Description updated in the current baseline (v10) |
| PRD-CRM-005 | Support quality analytics | Description | Customer satisfaction scores, support dashboards, complaint trends and early warnings. | Customer satisfaction scores, support dashboards, complaint trends and early warnings. Customers are asked to rate the service, with an optional comment, after their ticket is resolved, and these scores feed the dashboards. | Description updated in the current baseline (v10) |
| PRD-CRM-014 | Issue routing and escalation | Description | Support requests are grouped into categories and sent automatically to the right team, and escalated from first-line support to specialists; customers can report order problems directly. | Support requests are grouped into categories and sent automatically to the right team, and escalated from first-line support to specialists; customers can report order problems directly. When a customer reports a problem with an order, the ticket is filled in automatically with that order's details. | Description updated in the current baseline (v10) |
| PRD-IAM-004 | Multi-factor authentication by role | Description | Staff in sensitive roles must use a second check when logging in: a code from an authenticator app, a code sent by email or SMS, or a hardware security key. | Staff in sensitive roles must use a second check when logging in: a code from an authenticator app, a code sent by email or SMS, or a hardware security key. Buyers can also switch on a second login check for their own accounts and choose the factor (SMS, email or authenticator app). | Description updated in the current baseline (v10) |
| PRD-IAM-010 | User administration console | Description | A screen for staff to find users, view their details, activate or deactivate them and, when helping them, see the shop as they see it, with every action recorded. | A screen for staff to find users, view their details, activate or deactivate them and, when helping them, see the shop as they see it, with every action recorded. Customers can deactivate their own account and later reactivate it. | Description updated in the current baseline (v10) |
| PRD-IAM-011 | Staff invitation and access reviews | Description | Staff are invited by email, and managers regularly confirm that each person still needs their access. | Staff are invited by email, and managers regularly confirm that each person still needs their access. Administrators can also run access audit reports showing role assignments, privileged accounts and each user's MFA status. | Description updated in the current baseline (v10) |
| PRD-INT-001 | Public REST API | Description | A secure, documented technical interface (API) that lets other systems and apps read and update products, customers, orders, shipments, payments and documents, with access keys, limits on how often it can be called, numbered versions with notice before old versions are retired, and an optional flexible query format (GraphQL). | A secure, documented technical interface (API) that lets other systems and apps read and update products, customers, orders, shipments, payments and documents, with access keys, limits on how often it can be called, numbered versions with notice before old versions are retired, and an optional flexible query format (GraphQL). Partner systems sign in using the OAuth 2.0 / OpenID Connect standards. | Description updated in the current baseline (v10) |
| PRD-LOG-016 | Cross-border shipping | Description | Handles international postal shipping: customs declarations, international tracking and duties, using the postal systems CDS and IPS. | Handles international postal shipping: customs declarations, international tracking and duties, using the postal systems CDS and IPS. It also exchanges data with the UPU Global Monitoring System (GMS). | Description updated in the current baseline (v10) |
| PRD-LOG-025 | FedEx adapter | Description | Connects to FedEx for delivery services (as far as FedEx's system allows). | Connects to FedEx for delivery services (as far as FedEx's system allows). This includes shipment tracking events, which are fed into the tracking event hub. | Description updated in the current baseline (v10) |
| PRD-LOG-026 | G4S adapter | Description | Connects to G4S courier services in Kenya. | Connects to G4S courier services in Kenya. This includes shipment tracking events, which are fed into the tracking event hub. | Description updated in the current baseline (v10) |
| PRD-LOG-027 | Skynet adapter | Description | Connects to Skynet courier services. | Connects to Skynet courier services. This includes shipment tracking events, which are fed into the tracking event hub. | Description updated in the current baseline (v10) |
| PRD-LOG-028 | Wells Fargo (Kenya) courier adapter | Description | Connects to Wells Fargo courier services in Kenya. | Connects to Wells Fargo courier services in Kenya. This includes shipment tracking events, which are fed into the tracking event hub. | Description updated in the current baseline (v10) |
| PRD-LOG-029 | Aramex adapter | Description | Connects to Aramex courier services. | Connects to Aramex courier services. This includes shipment tracking events, which are fed into the tracking event hub. | Description updated in the current baseline (v10) |
| PRD-LOG-030 | Shipping lines and agents adapter | Description | Connects to shipping lines and shipping agents for sea freight. | Connects to shipping lines and shipping agents for sea freight. This includes shipment tracking events, which are fed into the tracking event hub. | Description updated in the current baseline (v10) |
| PRD-PAY-008 | Cash on delivery and cash at outlet | Description | Customers pay in cash on delivery or at an outlet, using a secure reference; the client decides which sellers, items or areas allow it. Demand drafts, banker's cheques and payment slips paid to the client are also accepted and matched by staff. | Customers pay in cash on delivery or at an outlet, using a secure reference; the client decides which sellers, items or areas allow it. Banker's cheques and payment slips paid to the client (local instruments to be confirmed per client) are also accepted and matched by staff. | Description updated in the current baseline (v10) |
| PRD-PAY-016 | Refunds | Description | Full or partial refunds back to the original payment method, with status tracking; large refunds need approval. | Full or partial refunds back to the original payment method, with status tracking; large refunds need approval. When part of an order is refunded, related fees are adjusted in proportion, and customers are shown the expected refund time for each payment method. | Description updated in the current baseline (v10) |
| PRD-RPT-011 | Commerce and marketing analytics | Description | Analysis of costs, customer groups, abandoned carts, marketing campaign results, customer segments, trends over time and groups of customers who joined at the same time. | Analysis of costs, customer groups, abandoned carts, marketing campaign results, customer segments, trends over time and groups of customers who joined at the same time. Advertising and campaign spend (for example Google Ads, social media or print) can be imported so that costs can be compared with sales; the cost sources are to be confirmed with the client. | Description updated in the current baseline (v10) |
| PRD-SRC-014 | Search engine: relevance, synonyms, multilingual | Description | A more powerful search engine that ranks the best matches first, understands synonyms and word forms, tolerates typing mistakes and works across languages. | A more powerful search engine that ranks the best matches first, understands synonyms and word forms, tolerates typing mistakes and works across languages. Administrators can set boosting rules (for example by category, featured items or location), and every change to these rules is recorded. | Description updated in the current baseline (v10) |
| PRD-TRK-006 | Notification preferences | Description | Customers choose which messages they want and on which channels, set quiet hours and limits, and follow a particular order. | Customers choose which messages they want and on which channels, set quiet hours and limits, and follow a particular order. Customers can also subscribe to, or unsubscribe from, updates for a single order. | Description updated in the current baseline (v10) |
| PRD-PAY-031 | KTDA bank card gateway adapter | Who benefits | KTDA; its shoppers | KTDA; KTDA shoppers | Updated in the current baseline (v10) |
| PRD-PAY-032 | MPC card gateway adapter | Who benefits | Malawi Post; its shoppers | Malawi Post; Malawi Post shoppers | Updated in the current baseline (v10) |
| PRD-PLT-002 | Client data isolation | Who benefits | Clients; their customers | Clients; clients' customers | Updated in the current baseline (v10) |
